alter table public.restaurants
add column if not exists access_suspended boolean not null default false,
add column if not exists suspension_reason text,
add column if not exists suspended_at timestamptz;

create table if not exists public.superadmin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  restaurant_id uuid references public.restaurants(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists superadmin_audit_restaurant_idx
on public.superadmin_audit_log(restaurant_id, created_at desc);

alter table public.superadmin_audit_log enable row level security;

-- Service-role calls bypass RLS. No browser role receives access to the audit log.
revoke all on public.superadmin_audit_log from anon, authenticated;

create or replace function public.can_edit(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.restaurant_members member
    join public.restaurants restaurant on restaurant.id = member.restaurant_id
    where member.restaurant_id = target
      and member.user_id = auth.uid()
      and member.role in ('owner','admin','editor')
      and restaurant.access_suspended = false
  );
$$;

create or replace function public.is_published_restaurant(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.restaurants
    where id = target
      and is_published = true
      and access_suspended = false
  );
$$;

drop policy if exists "public published restaurants" on public.restaurants;
create policy "public published restaurants"
on public.restaurants for select
using (
  (is_published and access_suspended = false)
  or public.is_member(id)
);

comment on column public.restaurants.access_suspended is
'Manual platform access suspension controlled by a trusted superadmin.';
comment on table public.superadmin_audit_log is
'Immutable operational record of trusted superadmin changes.';
