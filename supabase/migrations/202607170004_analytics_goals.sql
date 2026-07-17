create table if not exists public.restaurant_analytics_goals (
  restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
  weekly_menu_views integer not null default 100 check (weekly_menu_views between 1 and 1000000),
  weekly_cart_adds integer not null default 10 check (weekly_cart_adds between 1 and 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_restaurant_analytics_goals_updated_at on public.restaurant_analytics_goals;
create trigger set_restaurant_analytics_goals_updated_at before update on public.restaurant_analytics_goals
for each row execute function public.set_updated_at();

alter table public.restaurant_analytics_goals enable row level security;
revoke all on public.restaurant_analytics_goals from anon,authenticated;
grant select,insert,update on public.restaurant_analytics_goals to authenticated;

drop policy if exists "Members read analytics goals" on public.restaurant_analytics_goals;
create policy "Members read analytics goals" on public.restaurant_analytics_goals for select to authenticated
using (public.is_member(restaurant_id));

drop policy if exists "Members create analytics goals" on public.restaurant_analytics_goals;
create policy "Members create analytics goals" on public.restaurant_analytics_goals for insert to authenticated
with check (public.is_member(restaurant_id));

drop policy if exists "Members update analytics goals" on public.restaurant_analytics_goals;
create policy "Members update analytics goals" on public.restaurant_analytics_goals for update to authenticated
using (public.is_member(restaurant_id)) with check (public.is_member(restaurant_id));
