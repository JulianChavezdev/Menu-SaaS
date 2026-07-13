-- Public menu rows must only be readable while their restaurant is published.
create or replace function public.is_published_restaurant(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.restaurants
    where id = target and is_published = true
  );
$$;

create or replace function public.is_public_category(target uuid, target_restaurant uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.categories
    where id = target
      and restaurant_id = target_restaurant
      and is_active = true
  );
$$;

drop policy if exists "public active categories" on public.categories;
create policy "public active categories"
on public.categories for select
using (
  public.is_member(restaurant_id)
  or (is_active and public.is_published_restaurant(restaurant_id))
);

drop policy if exists "public available products" on public.products;
create policy "public available products"
on public.products for select
using (
  public.is_member(restaurant_id)
  or (
    is_available
    and public.is_published_restaurant(restaurant_id)
    and public.is_public_category(category_id, restaurant_id)
  )
);

-- Membership creation is performed by the trusted server after checking the
-- current user's role. The previous policy allowed any member to add owners.
drop policy if exists "owner add members" on public.restaurant_members;

-- Billing and ownership fields are controlled by trusted server processes.
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
     ) then
    raise exception 'Protected restaurant fields cannot be changed by this role'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_restaurant_system_fields on public.restaurants;
create trigger protect_restaurant_system_fields
before update on public.restaurants
for each row execute function public.protect_restaurant_system_fields();

-- A product and its category must always belong to the same tenant.
create or replace function public.enforce_product_category_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.categories
    where id = new.category_id and restaurant_id = new.restaurant_id
  ) then
    raise exception 'Product category belongs to another restaurant'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_product_category_tenant on public.products;
create trigger enforce_product_category_tenant
before insert or update of category_id, restaurant_id on public.products
for each row execute function public.enforce_product_category_tenant();

-- Trial limits must also be enforced in the database; client-side checks alone
-- can be bypassed through the REST API. The advisory lock serializes inserts for
-- one restaurant so two simultaneous requests cannot exceed the limit.
create or replace function public.enforce_trial_plan_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status public.subscription_state;
  current_count integer;
  row_limit integer;
begin
  if tg_op = 'UPDATE' and new.restaurant_id is not distinct from old.restaurant_id then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.restaurant_id::text, 0));
  select subscription_status into current_status
  from public.restaurants where id = new.restaurant_id;

  if current_status = 'active' then
    return new;
  end if;

  if tg_table_name = 'products' then
    row_limit := 3;
    select count(*) into current_count from public.products
    where restaurant_id = new.restaurant_id;
  elsif tg_table_name = 'categories' then
    row_limit := 5;
    select count(*) into current_count from public.categories
    where restaurant_id = new.restaurant_id;
  else
    raise exception 'Unsupported plan-limited table';
  end if;

  if current_count >= row_limit then
    raise exception 'Trial plan limit reached for %', tg_table_name
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_product_plan_limit on public.products;
create trigger enforce_product_plan_limit
before insert or update of restaurant_id on public.products
for each row execute function public.enforce_trial_plan_limits();

drop trigger if exists enforce_category_plan_limit on public.categories;
create trigger enforce_category_plan_limit
before insert or update of restaurant_id on public.categories
for each row execute function public.enforce_trial_plan_limits();

revoke all on function public.is_published_restaurant(uuid) from public;
revoke all on function public.is_public_category(uuid, uuid) from public;
grant execute on function public.is_published_restaurant(uuid) to anon, authenticated, service_role;
grant execute on function public.is_public_category(uuid, uuid) to anon, authenticated, service_role;
