create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  status text not null default 'processing' check (status in ('processing','processed')),
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.stripe_webhook_events enable row level security;

create unique index if not exists subscriptions_provider_subscription_unique
on public.subscriptions(provider_subscription_id)
where provider_subscription_id is not null;

comment on table public.stripe_webhook_events is
'Idempotency ledger for verified Stripe webhook events. Service role access only.';
