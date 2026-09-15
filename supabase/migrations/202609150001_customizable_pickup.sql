-- Optional configuration per product; existing menus and table orders stay unchanged.
alter table public.products add column if not exists customization jsonb not null default '{"enabled":false,"groups":[]}';
alter table public.products add constraint products_customization_object check(jsonb_typeof(customization)='object');
alter table public.restaurants add column if not exists pickup_enabled boolean not null default false;
alter table public.restaurants add column if not exists pickup_paused boolean not null default false;
alter table public.dining_order_items add column if not exists selected_options jsonb not null default '[]';
alter table public.dining_order_items add constraint order_options_array check(jsonb_typeof(selected_options)='array');
alter table public.dining_orders alter column table_id drop not null;
alter table public.dining_orders alter column table_session_id drop not null;
alter table public.dining_orders add column if not exists fulfillment text not null default 'table' check(fulfillment in ('table','pickup'));
alter table public.dining_orders add column if not exists payment_status text not null default 'unpaid' check(payment_status in ('unpaid','paid'));
alter table public.dining_orders add column if not exists paid_at timestamptz;
alter table public.dining_orders add column if not exists paid_by uuid references auth.users(id) on delete set null;
alter table public.dining_orders add column if not exists client_hash text;
alter table public.dining_orders add constraint dining_order_destination check(
  (fulfillment='table' and table_id is not null and table_session_id is not null)
  or (fulfillment='pickup' and table_id is null and table_session_id is null));
create unique index dining_orders_pickup_request_unique on public.dining_orders(restaurant_id,client_request_id) where fulfillment='pickup';
create index dining_orders_pickup_rate on public.dining_orders(restaurant_id,client_hash,created_at) where fulfillment='pickup';

create or replace function public.create_pickup_order(target_restaurant uuid,target_request uuid,target_customer_note text,target_items jsonb,target_client_hash text)
returns table(order_id uuid,order_public_token uuid,order_status text,order_created_at timestamptz,replayed boolean)
language plpgsql set search_path=public as $$
declare created public.dining_orders; item jsonb; product public.products; total integer:=0; subtotal integer;
begin
  -- Serialize submissions per restaurant, including concurrent rate-limit checks.
  perform pg_advisory_xact_lock(hashtextextended(target_restaurant::text,0));
  select * into created from public.dining_orders where restaurant_id=target_restaurant and fulfillment='pickup' and client_request_id=target_request;
  if found then return query select created.id,created.public_token,created.status,created.created_at,true;return;end if;
  perform 1 from public.restaurants where id=target_restaurant and ordering_enabled and pickup_enabled and not pickup_paused
    and is_published and not access_suspended and not publication_suspended_for_payment and subscription_status in ('active','trialing') for share;
  if not found then raise exception 'pickup_unavailable';end if;
  if (select count(*) from public.dining_orders where restaurant_id=target_restaurant and fulfillment='pickup' and client_hash=target_client_hash and created_at>now()-interval '1 minute')>=5 then raise exception 'rate_limit';end if;
  if (select count(*) from public.dining_orders where restaurant_id=target_restaurant and fulfillment='pickup' and created_at>now()-interval '1 minute')>=120 then raise exception 'rate_limit';end if;
  if jsonb_typeof(target_items)<>'array' or jsonb_array_length(target_items) not between 1 and 30 or length(coalesce(target_customer_note,''))>300 then raise exception 'invalid_order';end if;
  for item in select * from jsonb_array_elements(target_items) loop
    select p.* into product from public.products p join public.categories c on c.id=p.category_id and c.restaurant_id=p.restaurant_id
      where p.id=(item->>'product_id')::uuid and p.restaurant_id=target_restaurant and p.is_available and c.is_active for share of p,c;
    if not found or product.updated_at is distinct from (item->>'product_updated_at')::timestamptz then raise exception 'product_changed';end if;
    if (item->>'quantity')::integer not between 1 and 20 then raise exception 'invalid_quantity';end if;
    subtotal:=(item->>'unit_price_cents')::integer*(item->>'quantity')::integer;
    if subtotal<>(item->>'line_total_cents')::integer then raise exception 'invalid_total';end if;
    total:=total+subtotal;
  end loop;
  insert into public.dining_orders(restaurant_id,fulfillment,client_request_id,subtotal_cents,customer_note,client_hash)
    values(target_restaurant,'pickup',target_request,total,nullif(target_customer_note,''),target_client_hash) returning * into created;
  insert into public.dining_order_items(order_id,restaurant_id,product_id,product_name,unit_price_cents,quantity,note,line_total_cents,selected_options)
    select created.id,target_restaurant,item.product_id,item.product_name,item.unit_price_cents,item.quantity,nullif(item.note,''),item.line_total_cents,coalesce(item.selected_options,'[]')
    from jsonb_to_recordset(target_items) as item(product_id uuid,product_name text,unit_price_cents integer,quantity integer,note text,line_total_cents integer,selected_options jsonb);
  return query select created.id,created.public_token,created.status,created.created_at,false;
end;$$;
revoke all on function public.create_pickup_order(uuid,uuid,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.create_pickup_order(uuid,uuid,text,jsonb,text) to service_role;

-- Kitchen can mark pickup orders ready, but only the cashier action confirms payment.
create or replace function public.complete_pickup_order(target_restaurant uuid,target_order uuid,target_actor uuid)
returns boolean language plpgsql set search_path=public as $$
begin
  if not exists(select 1 from public.restaurant_members where restaurant_id=target_restaurant and user_id=target_actor and role in ('owner','admin','editor','waiter')) then raise exception 'forbidden';end if;
  update public.dining_orders set status='delivered',payment_status='paid',paid_at=now(),delivered_at=now(),paid_by=target_actor
    where id=target_order and restaurant_id=target_restaurant and fulfillment='pickup' and status='ready' and payment_status='unpaid';
  return found;
end;$$;
revoke all on function public.complete_pickup_order(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.complete_pickup_order(uuid,uuid,uuid) to service_role;
create or replace function public.create_public_dining_order(
  target_restaurant uuid,
  target_table uuid,
  target_session uuid,
  target_request uuid,
  target_subtotal integer,
  target_customer_note text,
  target_items jsonb
)
returns table(
  order_id uuid,
  order_public_token uuid,
  order_status text,
  order_created_at timestamptz,
  replayed boolean
)
language plpgsql
set search_path = public
as $$
declare
  created public.dining_orders;
begin
  select * into created
  from public.dining_orders
  where table_session_id = target_session
    and client_request_id = target_request;

  if found then
    return query select created.id, created.public_token, created.status,
      created.created_at, true;
    return;
  end if;

  insert into public.dining_orders(
    restaurant_id, table_id, table_session_id, client_request_id,
    status, subtotal_cents, customer_note
  ) values (
    target_restaurant, target_table, target_session, target_request,
    'pending', target_subtotal, nullif(target_customer_note, '')
  ) returning * into created;

  insert into public.dining_order_items(
    order_id, restaurant_id, product_id, product_name, unit_price_cents,
    quantity, note, line_total_cents, selected_options
  )
  select created.id, target_restaurant, item.product_id, item.product_name,
    item.unit_price_cents, item.quantity, nullif(item.note, ''),
    item.line_total_cents, coalesce(item.selected_options, '[]'::jsonb)
  from jsonb_to_recordset(target_items) as item(
    product_id uuid,
    product_name text,
    unit_price_cents integer,
    quantity integer,
    note text,
    selected_options jsonb,
    line_total_cents integer
  );

  return query select created.id, created.public_token, created.status,
    created.created_at, false;
exception when unique_violation then
  select * into created
  from public.dining_orders
  where table_session_id = target_session
    and client_request_id = target_request;
  if found then
    return query select created.id, created.public_token, created.status,
      created.created_at, true;
    return;
  end if;
  raise;
end;
$$;

revoke all on function public.create_public_dining_order(uuid,uuid,uuid,uuid,integer,text,jsonb) from public, anon, authenticated;
grant execute on function public.create_public_dining_order(uuid,uuid,uuid,uuid,integer,text,jsonb) to service_role;

create or replace function public.restore_restaurant_content(
  target_restaurant uuid,
  backup_restaurant jsonb,
  backup_categories jsonb,
  backup_products jsonb,
  actor_user uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status public.subscription_state;
  category_count integer;
  product_count integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'Service role required' using errcode = '42501'; end if;
  if jsonb_typeof(backup_restaurant) <> 'object' or jsonb_typeof(backup_categories) <> 'array' or jsonb_typeof(backup_products) <> 'array' then raise exception 'Invalid backup payload' using errcode = '22023'; end if;

  select subscription_status into current_status from public.restaurants where id = target_restaurant for update;
  if not found then raise exception 'Restaurant not found' using errcode = 'P0002'; end if;
  category_count := jsonb_array_length(backup_categories);
  product_count := jsonb_array_length(backup_products);
  if current_status <> 'active' and (category_count > 5 or product_count > 3) then raise exception 'Backup exceeds trial plan limits' using errcode = '23514'; end if;
  if category_count <> (select count(distinct item->>'id') from jsonb_array_elements(backup_categories) item)
     or category_count <> (select count(distinct item->>'slug') from jsonb_array_elements(backup_categories) item)
     or product_count <> (select count(distinct item->>'id') from jsonb_array_elements(backup_products) item) then raise exception 'Backup contains duplicate identifiers or category slugs' using errcode = '22023'; end if;
  if exists (select 1 from jsonb_array_elements(backup_products) product where not exists (select 1 from jsonb_array_elements(backup_categories) category where category->>'id' = product->>'category_id')) then raise exception 'A restored product references a missing category' using errcode = '23514'; end if;
  if exists (select 1 from public.categories category join jsonb_array_elements(backup_categories) item on category.id = (item->>'id')::uuid where category.restaurant_id <> target_restaurant)
     or exists (select 1 from public.products product join jsonb_array_elements(backup_products) item on product.id = (item->>'id')::uuid where product.restaurant_id <> target_restaurant) then raise exception 'Backup identifiers belong to another restaurant' using errcode = '23505'; end if;

  update public.restaurants set
    name = backup_restaurant->>'name', description = nullif(backup_restaurant->>'description', ''), logo_url = nullif(backup_restaurant->>'logo_url', ''),
    phone = nullif(backup_restaurant->>'phone', ''), email = nullif(backup_restaurant->>'email', ''), address = nullif(backup_restaurant->>'address', ''),
    instagram_url = nullif(backup_restaurant->>'instagram_url', ''), website_url = nullif(backup_restaurant->>'website_url', ''), currency = backup_restaurant->>'currency',
    locale = backup_restaurant->>'locale', timezone = backup_restaurant->>'timezone', is_published = (backup_restaurant->>'is_published')::boolean,
    language_switcher_enabled = (backup_restaurant->>'language_switcher_enabled')::boolean, menu_template = backup_restaurant->>'menu_template', translations = coalesce(backup_restaurant->'translations', '{}'::jsonb)
  where id = target_restaurant;

  delete from public.products where restaurant_id = target_restaurant;
  delete from public.categories where restaurant_id = target_restaurant;
  insert into public.categories(id, restaurant_id, name, slug, sort_order, is_active, translations, created_at, updated_at)
  select id, target_restaurant, name, slug, sort_order, is_active, coalesce(translations, '{}'::jsonb), coalesce(created_at, now()), coalesce(updated_at, now())
  from jsonb_to_recordset(backup_categories) as item(id uuid, name text, slug text, sort_order integer, is_active boolean, translations jsonb, created_at timestamptz, updated_at timestamptz);

  insert into public.products(id, restaurant_id, category_id, name, description, price_cents, video_url, video_path, image_url, image_path, allergens, customization, is_available, is_featured, sort_order, translations, created_at, updated_at)
  select id, target_restaurant, category_id, name, description, price_cents, video_url, video_path, image_url, image_path, coalesce(allergens, '{}'::text[]), coalesce(customization, '{"enabled":false,"groups":[]}'::jsonb), is_available, is_featured, sort_order, coalesce(translations, '{}'::jsonb), coalesce(created_at, now()), coalesce(updated_at, now())
  from jsonb_to_recordset(backup_products) as item(id uuid, category_id uuid, name text, description text, price_cents integer, video_url text, video_path text, image_url text, image_path text, allergens text[], customization jsonb, is_available boolean, is_featured boolean, sort_order integer, translations jsonb, created_at timestamptz, updated_at timestamptz);

  update public.menu_analytics_daily analytics set product_id = product.id from public.products product where analytics.restaurant_id = target_restaurant and analytics.event_type = 'product_view' and analytics.product_id is null and analytics.dimension_key = product.id::text and product.restaurant_id = target_restaurant;
  insert into public.superadmin_audit_log(actor_user_id, restaurant_id, action, details) values (actor_user, target_restaurant, 'restaurant.backup_restored', jsonb_build_object('categories', category_count, 'products', product_count, 'source_exported_at', backup_restaurant->>'source_exported_at'));
  return jsonb_build_object('categories', category_count, 'products', product_count);
end;
$$;

revoke all on function public.restore_restaurant_content(uuid, jsonb, jsonb, jsonb, uuid) from public;
grant execute on function public.restore_restaurant_content(uuid, jsonb, jsonb, jsonb, uuid) to service_role;
