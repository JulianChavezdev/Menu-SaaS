alter table public.products
  add column if not exists allergens text[] not null default '{}'::text[];

alter table public.products drop constraint if exists products_allergens_allowed;
alter table public.products
  add constraint products_allergens_allowed check (
    allergens <@ array[
      'gluten','crustaceans','eggs','fish','peanuts','soy','milk','nuts',
      'celery','mustard','sesame','sulphites','lupin','molluscs'
    ]::text[]
    and cardinality(allergens) <= 14
  );

comment on column public.products.allergens is
'Canonical Annex II allergen codes selected by the restaurant for customer display.';

update public.products product set allergens=case product.name
  when 'Hamburguesa Nebulosa' then array['gluten','eggs','milk']::text[]
  when 'Margherita Roma' then array['gluten','milk']::text[]
  when 'Flat White Central' then array['milk']::text[]
  when 'Tostada del Mercado' then array['gluten']::text[]
  when 'Croissant de Pistacho' then array['gluten','eggs','milk','nuts']::text[]
  when 'Nigiri de Salmón' then array['fish','soy']::text[]
  when 'Tarta de Queso Stratos' then array['gluten','eggs','milk']::text[]
  else product.allergens
end
from public.restaurants restaurant
where product.restaurant_id=restaurant.id and restaurant.slug='bistro-nube';

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

  insert into public.products(id, restaurant_id, category_id, name, description, price_cents, video_url, video_path, image_url, image_path, allergens, is_available, is_featured, sort_order, translations, created_at, updated_at)
  select id, target_restaurant, category_id, name, description, price_cents, video_url, video_path, image_url, image_path, coalesce(allergens, '{}'::text[]), is_available, is_featured, sort_order, coalesce(translations, '{}'::jsonb), coalesce(created_at, now()), coalesce(updated_at, now())
  from jsonb_to_recordset(backup_products) as item(id uuid, category_id uuid, name text, description text, price_cents integer, video_url text, video_path text, image_url text, image_path text, allergens text[], is_available boolean, is_featured boolean, sort_order integer, translations jsonb, created_at timestamptz, updated_at timestamptz);

  update public.menu_analytics_daily analytics set product_id = product.id from public.products product where analytics.restaurant_id = target_restaurant and analytics.event_type = 'product_view' and analytics.product_id is null and analytics.dimension_key = product.id::text and product.restaurant_id = target_restaurant;
  insert into public.superadmin_audit_log(actor_user_id, restaurant_id, action, details) values (actor_user, target_restaurant, 'restaurant.backup_restored', jsonb_build_object('categories', category_count, 'products', product_count, 'source_exported_at', backup_restaurant->>'source_exported_at'));
  return jsonb_build_object('categories', category_count, 'products', product_count);
end;
$$;

revoke all on function public.restore_restaurant_content(uuid, jsonb, jsonb, jsonb, uuid) from public;
grant execute on function public.restore_restaurant_content(uuid, jsonb, jsonb, jsonb, uuid) to service_role;
