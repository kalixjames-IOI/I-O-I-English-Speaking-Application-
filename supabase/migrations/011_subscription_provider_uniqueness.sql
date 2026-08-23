-- Stripe retries the same event; provider subscription IDs must be idempotent.
create unique index if not exists subscriptions_provider_subscription_key
  on public.subscriptions (provider_subscription_id)
  where provider_subscription_id is not null;
