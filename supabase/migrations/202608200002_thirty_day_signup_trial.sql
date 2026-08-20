-- New Menuly accounts receive 30 days of the selected product experience.
-- Expiration suspends publication but preserves the restaurant and its content.

alter table public.restaurants alter column subscription_status set default 'trialing';
alter table public.subscriptions alter column status set default 'trialing';

alter table public.restaurants add column if not exists signup_plan_interest text not null default 'carta';
alter table public.restaurants drop constraint if exists restaurants_signup_plan_interest_check;
alter table public.restaurants add constraint restaurants_signup_plan_interest_check
  check (signup_plan_interest in ('carta', 'pedidos', 'configuracion'));

create or replace function public.protect_restaurant_system_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and current_user not in ('postgres', 'supabase_admin')
     and (
       new.owner_id is distinct from old.owner_id
       or new.plan is distinct from old.plan
       or new.subscription_status is distinct from old.subscription_status
       or new.ordering_enabled is distinct from old.ordering_enabled
       or new.signup_plan_interest is distinct from old.signup_plan_interest
     ) then
    raise exception 'Protected restaurant fields cannot be changed by this role' using errcode = '42501';
  end if;
  return new;
end;
$$;

create index if not exists subscriptions_trial_expiration_idx
on public.subscriptions(current_period_end) where status = 'trialing';

create or replace function public.enforce_trial_plan_limits()
returns trigger language plpgsql security definer set search_path = public as $$
declare current_status public.subscription_state;
begin
  if tg_op = 'UPDATE' and new.restaurant_id is not distinct from old.restaurant_id then
    if tg_table_name = 'categories' then return new;
    elsif tg_table_name = 'products' and new.category_id is not distinct from old.category_id then return new;
    end if;
  end if;
  select subscription_status into current_status from public.restaurants where id = new.restaurant_id;
  if current_status not in ('active', 'trialing') then
    raise exception 'An active plan or trial is required' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.process_expired_trials()
returns integer language plpgsql security definer set search_path = public as $$
declare affected_ids uuid[]; affected_count integer;
begin
  select array_agg(subscription.restaurant_id) into affected_ids
  from public.subscriptions subscription
  join public.restaurants restaurant on restaurant.id = subscription.restaurant_id
  where subscription.status = 'trialing'
    and subscription.current_period_end is not null
    and subscription.current_period_end <= now()
    and restaurant.slug <> 'bistro-nube';
  affected_count := coalesce(array_length(affected_ids, 1), 0);
  if affected_count = 0 then return 0; end if;
  update public.subscriptions set status = 'past_due', updated_at = now() where restaurant_id = any(affected_ids);
  update public.restaurants set subscription_status = 'past_due', publication_suspended_for_payment = true,
    is_published = false, ordering_enabled = false, updated_at = now() where id = any(affected_ids);
  return affected_count;
end;
$$;

revoke all on function public.process_expired_trials() from public;
grant execute on function public.process_expired_trials() to service_role;

create or replace function public.trial_policy_version()
returns integer language sql stable security definer set search_path = public
as $$ select 20260820 $$;
revoke all on function public.trial_policy_version() from public;
grant execute on function public.trial_policy_version() to service_role;
