-- New restaurants require manual activation. Existing granted trials keep
-- their current expiration and are not revoked retroactively.

alter table public.restaurants
  alter column subscription_status set default 'past_due';

alter table public.subscriptions
  alter column status set default 'past_due';

create or replace function public.signup_access_policy_version()
returns integer
language sql
stable
security definer
set search_path = public
as $$ select 20260826 $$;

revoke all on function public.signup_access_policy_version() from public;
grant execute on function public.signup_access_policy_version() to service_role;
