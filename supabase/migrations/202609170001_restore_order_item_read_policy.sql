-- Some installations have the order policy but are missing the item policy.
-- Use the same restaurant membership boundary for the order and its snapshots.
alter table public.dining_order_items enable row level security;
drop policy if exists "members read dining order items" on public.dining_order_items;
create policy "members read dining order items" on public.dining_order_items
for select to authenticated using (public.is_member(restaurant_id));

create or replace function public.order_history_policy_ready() returns boolean
language sql stable set search_path=public as $$
  select exists(select 1 from pg_policies where schemaname='public'
    and tablename='dining_order_items' and policyname='members read dining order items'
    and cmd='SELECT' and roles=array['authenticated']::name[]
    and qual='is_member(restaurant_id)')
  and (select relrowsecurity from pg_class where oid='public.dining_order_items'::regclass)
$$;
revoke all on function public.order_history_policy_ready() from public,anon,authenticated;
grant execute on function public.order_history_policy_ready() to service_role;
