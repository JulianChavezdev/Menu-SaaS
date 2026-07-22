-- Menuly no longer offers a free trial. New restaurants remain pending until
-- a manual or Stripe payment activates Plan Carta. Existing trial data is
-- preserved, but publication and further content creation require activation.

alter table public.restaurants
  alter column subscription_status set default 'past_due';

alter table public.subscriptions
  alter column status set default 'past_due';

update public.restaurants
set subscription_status = 'past_due',
    is_published = false,
    publication_suspended_for_payment = true
where subscription_status = 'trialing';

update public.subscriptions
set status = 'past_due',
    current_period_end = null
where status = 'trialing';

drop index if exists public.subscriptions_trial_expiration_idx;

create or replace function public.enforce_trial_plan_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status public.subscription_state;
begin
  if tg_op = 'UPDATE' and new.restaurant_id is not distinct from old.restaurant_id then
    if tg_table_name = 'categories' then
      return new;
    elsif tg_table_name = 'products' and new.category_id is not distinct from old.category_id then
      return new;
    end if;
  end if;

  select subscription_status into current_status
  from public.restaurants
  where id = new.restaurant_id;

  if current_status <> 'active' then
    raise exception 'An active Plan Carta is required'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.process_expired_trials()
returns integer
language sql
security definer
set search_path = public
as $$ select 0 $$;

revoke all on function public.process_expired_trials() from public;
grant execute on function public.process_expired_trials() to service_role;

create or replace function public.paid_access_policy_version()
returns integer
language sql
stable
security definer
set search_path = public
as $$ select 20260722 $$;

revoke all on function public.paid_access_policy_version() from public;
grant execute on function public.paid_access_policy_version() to service_role;
