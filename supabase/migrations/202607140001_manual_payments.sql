create table if not exists public.manual_payments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'EUR' check (currency in ('EUR','USD','GBP','MXN')),
  method text not null default 'bizum' check (method in ('bizum','cash','bank_transfer','other')),
  paid_at timestamptz not null,
  period_end timestamptz not null,
  reference text,
  notes text,
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (period_end >= paid_at)
);

create index if not exists manual_payments_restaurant_idx
on public.manual_payments(restaurant_id, paid_at desc);

alter table public.manual_payments enable row level security;

-- Payments contain private operational data and are managed only with the
-- service role after the server verifies the superadmin allowlist.
revoke all on public.manual_payments from anon, authenticated;

comment on table public.manual_payments is
'Private ledger for Bizum and other manually confirmed subscription payments.';

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
    provider = 'manual',
    provider_customer_id = null,
    provider_subscription_id = null,
    plan = 'carta',
    status = 'active',
    current_period_end = excluded.current_period_end;

  update public.restaurants set
    subscription_status = 'active',
    access_suspended = false,
    suspension_reason = null,
    suspended_at = null
  where id = target_restaurant;

  if not found then
    raise exception 'Restaurant not found' using errcode = 'P0002';
  end if;
  return payment_id;
end;
$$;

revoke all on function public.record_manual_payment(uuid, integer, text, text, timestamptz, timestamptz, text, text, uuid) from public;
grant execute on function public.record_manual_payment(uuid, integer, text, text, timestamptz, timestamptz, text, text, uuid) to service_role;
