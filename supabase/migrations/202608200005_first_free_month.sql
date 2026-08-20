create unique index if not exists superadmin_first_free_month_once_idx
on public.superadmin_audit_log(restaurant_id)
where action = 'subscription.first_free_month_granted' and restaurant_id is not null;

create or replace function public.grant_first_free_month(
  target_restaurant uuid,
  actor_user uuid
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  grant_end timestamptz;
  selected_plan text;
  existing_status public.subscription_state;
  existing_end timestamptz;
begin
  select restaurant.plan, subscription.status, subscription.current_period_end
    into selected_plan, existing_status, existing_end
  from public.restaurants restaurant
  left join public.subscriptions subscription on subscription.restaurant_id = restaurant.id
  where restaurant.id = target_restaurant
  for update of restaurant;

  if not found then
    raise exception 'Restaurant not found' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.superadmin_audit_log
    where restaurant_id = target_restaurant
      and action = 'subscription.first_free_month_granted'
  ) then
    raise exception 'The first free month was already granted' using errcode = '23505';
  end if;

  if exists (
    select 1 from public.manual_payments where restaurant_id = target_restaurant
  ) then
    raise exception 'A paid subscription already exists for this restaurant' using errcode = '23514';
  end if;

  grant_end := case
    when existing_status = 'trialing' and existing_end > now() then existing_end
    else now() + interval '30 days'
  end;

  insert into public.subscriptions(
    restaurant_id, provider, provider_customer_id, provider_subscription_id,
    plan, status, current_period_end
  ) values (
    target_restaurant, 'manual', null, null, coalesce(selected_plan, 'carta'),
    'trialing', grant_end
  )
  on conflict (restaurant_id) do update set
    provider = 'manual',
    provider_customer_id = null,
    provider_subscription_id = null,
    plan = excluded.plan,
    status = 'trialing',
    current_period_end = excluded.current_period_end;

  update public.restaurants set
    subscription_status = 'trialing',
    is_published = case when publication_suspended_for_payment then true else is_published end,
    publication_suspended_for_payment = false,
    access_suspended = false,
    suspension_reason = null,
    suspended_at = null
  where id = target_restaurant;

  insert into public.superadmin_audit_log(
    actor_user_id, restaurant_id, action, details
  ) values (
    actor_user, target_restaurant, 'subscription.first_free_month_granted',
    jsonb_build_object('period_end', grant_end, 'manual_payment_created', false)
  );

  return grant_end;
end;
$$;

revoke all on function public.grant_first_free_month(uuid, uuid) from public;
grant execute on function public.grant_first_free_month(uuid, uuid) to service_role;

comment on function public.grant_first_free_month(uuid, uuid) is
'Grants one non-renewable 30-day trial without creating a manual payment ledger entry.';
