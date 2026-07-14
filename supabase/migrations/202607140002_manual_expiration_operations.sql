create or replace function public.process_manual_expirations(
  grace_days integer,
  suspend_access boolean,
  actor_user uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_ids uuid[];
  affected_count integer;
  audit_action text;
begin
  if grace_days < 0 or grace_days > 30 then
    raise exception 'Grace days must be between 0 and 30'
      using errcode = '22023';
  end if;

  select array_agg(subscription.restaurant_id)
  into affected_ids
  from public.subscriptions subscription
  join public.restaurants restaurant on restaurant.id = subscription.restaurant_id
  where subscription.provider = 'manual'
    and subscription.current_period_end is not null
    and subscription.current_period_end < now() - make_interval(days => grace_days)
    and (
      (suspend_access and subscription.status in ('active','past_due') and restaurant.access_suspended = false)
      or
      (not suspend_access and subscription.status = 'active' and restaurant.access_suspended = false)
    );

  affected_count := coalesce(array_length(affected_ids, 1), 0);
  if affected_count = 0 then return 0; end if;

  update public.subscriptions set
    status = case when suspend_access then 'canceled'::public.subscription_state else 'past_due'::public.subscription_state end
  where restaurant_id = any(affected_ids);

  update public.restaurants set
    subscription_status = case when suspend_access then 'canceled'::public.subscription_state else 'past_due'::public.subscription_state end,
    access_suspended = case when suspend_access then true else access_suspended end,
    suspension_reason = case when suspend_access then 'Suscripción manual vencida.' else suspension_reason end,
    suspended_at = case when suspend_access then now() else suspended_at end
  where id = any(affected_ids);

  audit_action := case when suspend_access then 'access.expired_suspended' else 'payment.expired_marked' end;
  insert into public.superadmin_audit_log(actor_user_id, restaurant_id, action, details)
  select actor_user, id, audit_action, jsonb_build_object('grace_days', grace_days, 'bulk', true)
  from unnest(affected_ids) as id;

  return affected_count;
end;
$$;

revoke all on function public.process_manual_expirations(integer, boolean, uuid) from public;
grant execute on function public.process_manual_expirations(integer, boolean, uuid) to service_role;

comment on function public.process_manual_expirations(integer, boolean, uuid) is
'Marks overdue manual subscriptions past_due or suspends them after an explicit trusted-server action.';
