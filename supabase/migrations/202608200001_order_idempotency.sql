-- Impide que un doble toque o un reintento de red duplique una comanda.

alter table public.dining_orders
  add column if not exists client_request_id uuid not null default gen_random_uuid();

create unique index if not exists dining_orders_session_request_unique
  on public.dining_orders(table_session_id, client_request_id);

comment on column public.dining_orders.client_request_id is
  'Identificador generado por el dispositivo para hacer idempotente el envío.';

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
    quantity, note, line_total_cents
  )
  select created.id, target_restaurant, item.product_id, item.product_name,
    item.unit_price_cents, item.quantity, nullif(item.note, ''),
    item.line_total_cents
  from jsonb_to_recordset(target_items) as item(
    product_id uuid,
    product_name text,
    unit_price_cents integer,
    quantity integer,
    note text,
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
