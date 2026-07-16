alter table public.restaurants
add column if not exists publication_suspended_for_payment boolean not null default false;

-- Every existing trial gets the same seven-day window from its creation.
update public.subscriptions
set current_period_end = created_at + interval '7 days'
where status = 'trialing' and current_period_end is null;

-- The permanent showcase is not a customer trial.
update public.restaurants
set subscription_status = 'active', publication_suspended_for_payment = false
where slug = 'bistro-nube';

update public.subscriptions
set status = 'active', current_period_end = null
where restaurant_id in (select id from public.restaurants where slug = 'bistro-nube');

create or replace function public.process_expired_trials()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_ids uuid[];
  affected_count integer;
begin
  select array_agg(subscription.restaurant_id)
  into affected_ids
  from public.subscriptions subscription
  join public.restaurants restaurant on restaurant.id = subscription.restaurant_id
  where subscription.status = 'trialing'
    and subscription.current_period_end is not null
    and subscription.current_period_end <= now()
    and restaurant.slug <> 'bistro-nube';

  affected_count := coalesce(array_length(affected_ids, 1), 0);
  if affected_count = 0 then return 0; end if;

  update public.subscriptions
  set status = 'past_due'
  where restaurant_id = any(affected_ids);

  update public.restaurants
  set subscription_status = 'past_due',
      publication_suspended_for_payment = true,
      is_published = false
  where id = any(affected_ids);

  return affected_count;
end;
$$;

revoke all on function public.process_expired_trials() from public;
grant execute on function public.process_expired_trials() to service_role;

create index if not exists subscriptions_trial_expiration_idx
on public.subscriptions(current_period_end)
where status = 'trialing';

create or replace function public.record_manual_payment(
  target_restaurant uuid,
  payment_amount_cents integer,
  payment_currency text,
  payment_method text,
  payment_paid_at timestamptz,
  payment_period_end timestamptz,
  payment_reference text,
  payment_notes text,
  actor_user uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  payment_id uuid;
begin
  insert into public.manual_payments(
    restaurant_id, amount_cents, currency, method, paid_at, period_end,
    reference, notes, recorded_by
  ) values (
    target_restaurant, payment_amount_cents, payment_currency, payment_method,
    payment_paid_at, payment_period_end, nullif(payment_reference, ''),
    nullif(payment_notes, ''), actor_user
  ) returning id into payment_id;

  insert into public.subscriptions(
    restaurant_id, provider, provider_customer_id, provider_subscription_id,
    plan, status, current_period_end
  ) values (
    target_restaurant, 'manual', null, null, 'carta', 'active', payment_period_end
  )
  on conflict (restaurant_id) do update set
    provider = 'manual', provider_customer_id = null,
    provider_subscription_id = null, plan = 'carta', status = 'active',
    current_period_end = excluded.current_period_end;

  update public.restaurants set
    subscription_status = 'active',
    is_published = case when publication_suspended_for_payment then true else is_published end,
    publication_suspended_for_payment = false,
    access_suspended = false,
    suspension_reason = null,
    suspended_at = null
  where id = target_restaurant;

  if not found then raise exception 'Restaurant not found' using errcode = 'P0002'; end if;
  return payment_id;
end;
$$;

revoke all on function public.record_manual_payment(uuid, integer, text, text, timestamptz, timestamptz, text, text, uuid) from public;
grant execute on function public.record_manual_payment(uuid, integer, text, text, timestamptz, timestamptz, text, text, uuid) to service_role;

select public.process_expired_trials();
