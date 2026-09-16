alter table public.restaurants add column customer_order_mode text not null default 'menu_only' check(customer_order_mode in ('menu_only','table_orders'));
alter table public.restaurants add column payment_timing text not null default 'after' check(payment_timing in ('before','after'));
alter table public.restaurants add column customer_orders_paused boolean not null default false;
alter table public.restaurants add column opening_hours jsonb not null default '[{"day":0,"periods":[{"start":"12:00","end":"23:00"}]},{"day":1,"periods":[{"start":"12:00","end":"23:00"}]},{"day":2,"periods":[{"start":"12:00","end":"23:00"}]},{"day":3,"periods":[{"start":"12:00","end":"23:00"}]},{"day":4,"periods":[{"start":"12:00","end":"23:00"}]},{"day":5,"periods":[{"start":"12:00","end":"23:00"}]},{"day":6,"periods":[{"start":"12:00","end":"23:00"}]}]' check(jsonb_typeof(opening_hours)='array');
alter table public.restaurant_tables add column orders_paused_until timestamptz;
alter table public.dining_orders add column payment_timing text not null default 'after' check(payment_timing in ('before','after'));
alter table public.dining_orders add column order_source text not null default 'staff' check(order_source in ('staff','table_qr'));
alter table public.dining_orders add column pos_reference text check(char_length(pos_reference)<=80);

create unique index dining_orders_table_qr_request_unique on public.dining_orders(table_id,client_request_id) where order_source='table_qr';

-- Evaluate actual service windows at request time, including overnight shifts and DST.
create or replace function public.restaurant_ordering_window(target_restaurant uuid,at_time timestamptz default now())
returns table(opens_at timestamptz,closes_at timestamptz) language sql stable set search_path=public as $$
  with settings as(select opening_hours,coalesce(timezone,'Europe/Madrid') as zone from restaurants where id=target_restaurant),
  windows as(select ((day_date+p.start::time) at time zone s.zone) as start_at,
    ((day_date+p.end::time+case when p.end::time<=p.start::time then interval '1 day' else interval '0 days' end) at time zone s.zone) as end_at
    from settings s cross join lateral (select (at_time at time zone s.zone)::date-offset_days as day_date from generate_series(0,1) offset_days) dates
    cross join lateral jsonb_to_recordset(s.opening_hours) as d(day integer,periods jsonb)
    cross join lateral jsonb_to_recordset(d.periods) as p(start text,"end" text)
    where d.day=extract(dow from day_date))
  select min(start_at),max(end_at) from windows where at_time>=start_at and at_time<end_at having count(*)>0;
$$;
revoke all on function public.restaurant_ordering_window(uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.restaurant_ordering_window(uuid,timestamptz) to service_role;

create or replace function public.table_ordering_context(target_code uuid)
returns jsonb language sql stable set search_path=public as $$
  select jsonb_build_object('tableId',t.id,'tableCode',t.public_code,'tableName',t.name,'restaurantId',r.id,'slug',r.slug,
    'enabled',r.ordering_enabled and r.customer_order_mode='table_orders',
    'active',r.ordering_enabled and r.customer_order_mode='table_orders' and not r.customer_orders_paused and t.is_active
      and r.is_published and not r.access_suspended and not r.publication_suspended_for_payment and r.subscription_status in ('active','trialing')
      and w.closes_at is not null and (t.orders_paused_until is null or t.orders_paused_until<=now()),
    'expiresAt',w.closes_at,'paymentTiming',r.payment_timing)
  from restaurant_tables t join restaurants r on r.id=t.restaurant_id
  left join lateral restaurant_ordering_window(r.id) w on true where t.public_code=target_code and t.is_active;
$$;
revoke all on function public.table_ordering_context(uuid) from public,anon,authenticated;
grant execute on function public.table_ordering_context(uuid) to service_role;

create or replace function public.create_table_qr_order(target_table_code uuid,target_request uuid,target_note text,target_items jsonb,target_client_hash text)
returns jsonb language plpgsql set search_path=public as $$
declare t restaurant_tables; r restaurants; s table_sessions; existing dining_orders; created dining_orders;
  window_start timestamptz;window_end timestamptz;item jsonb;product products;total integer:=0;
begin
  select * into t from restaurant_tables where public_code=target_table_code for update;
  if not found then raise exception 'table_unavailable';end if;
  select * into existing from dining_orders where table_id=t.id and order_source='table_qr' and client_request_id=target_request;
  if found then return jsonb_build_object('order_id',existing.id,'order_public_token',existing.public_token,'order_status',existing.status,'payment_timing',existing.payment_timing,'payment_status',existing.payment_status,'replayed',true);end if;
  select * into r from restaurants where id=t.restaurant_id for share;
  select opens_at,closes_at into window_start,window_end from restaurant_ordering_window(r.id);
  if not t.is_active or not r.ordering_enabled or r.customer_order_mode<>'table_orders' or r.customer_orders_paused
    or not r.is_published or r.access_suspended or r.publication_suspended_for_payment or r.subscription_status not in ('active','trialing')
    or window_end is null or t.orders_paused_until>now() then raise exception 'table_closed';end if;
  perform pg_advisory_xact_lock(hashtextextended(r.id::text||coalesce(target_client_hash,''),0));
  if (select count(*) from dining_orders where table_id=t.id and created_at>now()-interval '1 minute')>=10
    or (select count(*) from dining_orders where restaurant_id=r.id and client_hash=target_client_hash and created_at>now()-interval '1 minute')>=5 then raise exception 'rate_limit';end if;
  if jsonb_typeof(target_items)<>'array' or jsonb_array_length(target_items) not between 1 and 30 or length(coalesce(target_note,''))>300 then raise exception 'invalid_order';end if;
  for item in select * from jsonb_array_elements(target_items) loop
    select p.* into product from products p join categories c on c.id=p.category_id and c.restaurant_id=p.restaurant_id
      where p.id=(item->>'product_id')::uuid and p.restaurant_id=r.id and p.is_available and c.is_active for share of p,c;
    if not found or product.updated_at is distinct from (item->>'product_updated_at')::timestamptz then raise exception 'product_changed';end if;
    if (item->>'quantity')::integer not between 1 and 20 or (item->>'unit_price_cents')::integer*(item->>'quantity')::integer<>(item->>'line_total_cents')::integer then raise exception 'invalid_total';end if;
    total:=total+(item->>'line_total_cents')::integer;
  end loop;
  update table_sessions set status='expired',closed_at=now() where table_id=t.id and status='open' and (expires_at<=now() or started_at<window_start);
  select * into s from table_sessions where table_id=t.id and status='open' for update;
  if not found then
    insert into table_sessions(restaurant_id,table_id,expires_at) values(r.id,t.id,window_end) returning * into s;
  end if;
  insert into dining_orders(restaurant_id,table_id,table_session_id,client_request_id,customer_note,subtotal_cents,client_hash,payment_timing,order_source)
    values(r.id,t.id,s.id,target_request,nullif(target_note,''),total,target_client_hash,r.payment_timing,'table_qr') returning * into created;
  insert into dining_order_items(order_id,restaurant_id,product_id,product_name,unit_price_cents,quantity,note,line_total_cents,selected_options)
    select created.id,r.id,i.product_id,i.product_name,i.unit_price_cents,i.quantity,nullif(i.note,''),i.line_total_cents,coalesce(i.selected_options,'[]')
    from jsonb_to_recordset(target_items) as i(product_id uuid,product_name text,unit_price_cents integer,quantity integer,note text,line_total_cents integer,selected_options jsonb);
  return jsonb_build_object('order_id',created.id,'order_public_token',created.public_token,'order_status',created.status,'payment_timing',created.payment_timing,'payment_status',created.payment_status,'replayed',false);
end;$$;
revoke all on function public.create_table_qr_order(uuid,uuid,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.create_table_qr_order(uuid,uuid,text,jsonb,text) to service_role;

create or replace function public.protect_order_payment() returns trigger language plpgsql set search_path=public as $$
begin
  if current_user not in ('postgres','supabase_admin') and coalesce(auth.role(),'')<>'service_role' and
    (new.payment_status is distinct from old.payment_status or new.paid_at is distinct from old.paid_at or new.paid_by is distinct from old.paid_by or new.payment_timing is distinct from old.payment_timing or new.order_source is distinct from old.order_source or new.pos_reference is distinct from old.pos_reference) then raise exception 'protected_payment_fields';end if;
  if new.payment_timing='before' and new.payment_status<>'paid' and new.status in ('accepted','preparing','ready','delivered') then raise exception 'payment_required';end if;
  return new;
end;$$;
create trigger dining_order_payment_guard before update on public.dining_orders for each row execute function public.protect_order_payment();

create or replace function public.record_order_payment(target_restaurant uuid,target_order uuid,target_actor uuid,target_reference text default null)
returns boolean language plpgsql set search_path=public as $$
begin
  if not exists(select 1 from restaurant_members where restaurant_id=target_restaurant and user_id=target_actor and role in ('owner','admin','editor','kitchen')) then raise exception 'forbidden';end if;
  if length(coalesce(target_reference,''))>80 then raise exception 'invalid_reference';end if;
  update dining_orders set payment_status='paid',paid_at=now(),paid_by=target_actor,pos_reference=nullif(btrim(target_reference),'')
    where id=target_order and restaurant_id=target_restaurant and payment_status='unpaid' and status not in ('cancelled','rejected');
  return found;
end;$$;
revoke all on function public.record_order_payment(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.record_order_payment(uuid,uuid,uuid,text) to service_role;

-- Public pickup links no longer authorize new orders. Tracking remains available.
revoke execute on function public.create_pickup_order(uuid,uuid,text,jsonb,text) from service_role;

revoke execute on function public.complete_pickup_order(uuid,uuid,uuid) from service_role;
