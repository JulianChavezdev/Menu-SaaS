-- Menuly Pedidos: mesas, sesiones temporales y comandas a cocina.
-- No registra pagos ni genera documentos fiscales.

alter table public.restaurants
  add column if not exists ordering_enabled boolean not null default false;

comment on column public.restaurants.ordering_enabled is
  'Activa Menuly Pedidos. Campo comercial protegido y gestionado por superadmin.';

create or replace function public.protect_restaurant_system_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and current_user not in ('postgres', 'supabase_admin')
     and (
       new.owner_id is distinct from old.owner_id
       or new.plan is distinct from old.plan
       or new.subscription_status is distinct from old.subscription_status
       or new.ordering_enabled is distinct from old.ordering_enabled
     ) then
    raise exception 'Protected restaurant fields cannot be changed by this role'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create table if not exists public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  public_code uuid not null default gen_random_uuid() unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, name),
  unique (id, restaurant_id)
);

create table if not exists public.table_sessions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_id uuid not null references public.restaurant_tables(id) on delete cascade,
  status text not null default 'open' check (status in ('open','closed','expired')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  closed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > started_at),
  unique (id, restaurant_id, table_id),
  foreign key (table_id, restaurant_id) references public.restaurant_tables(id, restaurant_id) on delete cascade
);

create unique index if not exists table_sessions_one_open_per_table_idx
  on public.table_sessions(table_id) where status = 'open';
create index if not exists table_sessions_restaurant_status_idx
  on public.table_sessions(restaurant_id, status, expires_at desc);

create table if not exists public.dining_orders (
  id uuid primary key default gen_random_uuid(),
  public_token uuid not null default gen_random_uuid() unique,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_id uuid not null references public.restaurant_tables(id) on delete restrict,
  table_session_id uuid not null references public.table_sessions(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending','accepted','preparing','ready','delivered','rejected','cancelled')),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  customer_note text check (customer_note is null or char_length(customer_note) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  ready_at timestamptz,
  delivered_at timestamptz,
  unique (id, restaurant_id),
  foreign key (table_id, restaurant_id) references public.restaurant_tables(id, restaurant_id) on delete restrict,
  foreign key (table_session_id, restaurant_id, table_id) references public.table_sessions(id, restaurant_id, table_id) on delete restrict
);

create index if not exists dining_orders_restaurant_status_idx
  on public.dining_orders(restaurant_id, status, created_at desc);
create index if not exists dining_orders_session_idx
  on public.dining_orders(table_session_id, created_at desc);

create table if not exists public.dining_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.dining_orders(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null check (char_length(btrim(product_name)) between 1 and 120),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity between 1 and 20),
  note text check (note is null or char_length(note) <= 300),
  line_total_cents integer not null check (line_total_cents >= 0),
  created_at timestamptz not null default now(),
  foreign key (order_id, restaurant_id) references public.dining_orders(id, restaurant_id) on delete cascade
);

create index if not exists dining_order_items_order_idx
  on public.dining_order_items(order_id);

drop trigger if exists restaurant_tables_updated on public.restaurant_tables;
create trigger restaurant_tables_updated before update on public.restaurant_tables
for each row execute function public.set_updated_at();
drop trigger if exists table_sessions_updated on public.table_sessions;
create trigger table_sessions_updated before update on public.table_sessions
for each row execute function public.set_updated_at();
drop trigger if exists dining_orders_updated on public.dining_orders;
create trigger dining_orders_updated before update on public.dining_orders
for each row execute function public.set_updated_at();

alter table public.restaurant_tables enable row level security;
alter table public.table_sessions enable row level security;
alter table public.dining_orders enable row level security;
alter table public.dining_order_items enable row level security;

drop policy if exists "members read restaurant tables" on public.restaurant_tables;
create policy "members read restaurant tables" on public.restaurant_tables
for select to authenticated using (public.is_member(restaurant_id));
drop policy if exists "editors manage restaurant tables" on public.restaurant_tables;
create policy "editors manage restaurant tables" on public.restaurant_tables
for all to authenticated using (public.can_edit(restaurant_id)) with check (public.can_edit(restaurant_id));

drop policy if exists "members read table sessions" on public.table_sessions;
create policy "members read table sessions" on public.table_sessions
for select to authenticated using (public.is_member(restaurant_id));
drop policy if exists "editors manage table sessions" on public.table_sessions;
create policy "editors manage table sessions" on public.table_sessions
for all to authenticated using (public.can_edit(restaurant_id)) with check (public.can_edit(restaurant_id));

drop policy if exists "members read dining orders" on public.dining_orders;
create policy "members read dining orders" on public.dining_orders
for select to authenticated using (public.is_member(restaurant_id));
drop policy if exists "editors update dining orders" on public.dining_orders;
create policy "editors update dining orders" on public.dining_orders
for update to authenticated using (public.can_edit(restaurant_id)) with check (public.can_edit(restaurant_id));

drop policy if exists "members read dining order items" on public.dining_order_items;
create policy "members read dining order items" on public.dining_order_items
for select to authenticated using (public.is_member(restaurant_id));

do $$
begin
  alter publication supabase_realtime add table public.dining_orders;
exception when duplicate_object then null;
end $$;
