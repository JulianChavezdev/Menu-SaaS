create table if not exists public.restaurant_sales_status (
  restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
  stage text not null default 'new' check (stage in ('new','contacted','interested','converted','not_continuing')),
  note text check (note is null or char_length(note) <= 1000),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists restaurant_sales_status_updated on public.restaurant_sales_status;
create trigger restaurant_sales_status_updated before update on public.restaurant_sales_status
for each row execute function public.set_updated_at();

alter table public.restaurant_sales_status enable row level security;
revoke all on table public.restaurant_sales_status from anon, authenticated;

create or replace function public.sales_followup_policy_version()
returns integer language sql stable security definer set search_path = public
as $$ select 20260820 $$;
revoke all on function public.sales_followup_policy_version() from public;
grant execute on function public.sales_followup_policy_version() to service_role;

