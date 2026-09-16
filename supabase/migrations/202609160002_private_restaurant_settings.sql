-- Public menus are served by the application with an explicit public projection.
-- Published status must not expose owner IDs, billing and service settings via REST.
drop policy if exists "public published restaurants" on public.restaurants;
create policy "members read restaurant settings" on public.restaurants for select to authenticated using (public.is_member(id));

create or replace function public.restaurant_privacy_policy_version() returns integer language sql stable set search_path=public as $$select 20260916$$;
revoke all on function public.restaurant_privacy_policy_version() from public,anon,authenticated;
grant execute on function public.restaurant_privacy_policy_version() to service_role;

-- Onboarding uses a trusted action; direct INSERT could forge paid access.
drop policy if exists "owners create restaurants" on public.restaurants;

create or replace function public.protect_restaurant_system_fields()
returns trigger language plpgsql set search_path=public as $$
begin
  if coalesce(auth.role(),'')<>'service_role' and current_user not in ('postgres','supabase_admin') and (
    new.owner_id is distinct from old.owner_id or new.plan is distinct from old.plan
    or new.subscription_status is distinct from old.subscription_status or new.ordering_enabled is distinct from old.ordering_enabled
    or new.signup_plan_interest is distinct from old.signup_plan_interest or new.access_suspended is distinct from old.access_suspended
    or new.suspension_reason is distinct from old.suspension_reason or new.suspended_at is distinct from old.suspended_at
    or new.publication_suspended_for_payment is distinct from old.publication_suspended_for_payment
  ) then raise exception 'Protected restaurant fields cannot be changed by this role' using errcode='42501';end if;
  return new;
end;$$;
