create or replace function public.create_table_qr_order(target_table_code uuid,target_request uuid,target_note text,target_items jsonb,target_client_hash text,target_payment_timing text)
returns jsonb language plpgsql set search_path=public as $$
declare t restaurant_tables; r restaurants; s table_sessions; existing dining_orders; created dining_orders;
  window_start timestamptz;window_end timestamptz;item jsonb;product products;total integer:=0;
begin
  select * into t from restaurant_tables where public_code=target_table_code for update;
  if not found then raise exception 'table_unavailable';end if;
  select * into existing from dining_orders where table_id=t.id and order_source='table_qr' and client_request_id=target_request;
  if found then return jsonb_build_object('order_id',existing.id,'order_public_token',existing.public_token,'order_status',existing.status,'payment_timing',existing.payment_timing,'payment_status',existing.payment_status,'replayed',true);end if;
  select * into r from restaurants where id=t.restaurant_id for share;
  if target_payment_timing is distinct from r.payment_timing then raise exception 'payment_settings_changed';end if;
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
revoke all on function public.create_table_qr_order(uuid,uuid,text,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.create_table_qr_order(uuid,uuid,text,jsonb,text,text) to service_role;

-- Keep the service-only legacy signature during rollout. Public callers cannot
-- execute either signature; the application requires the expected payment timing.
