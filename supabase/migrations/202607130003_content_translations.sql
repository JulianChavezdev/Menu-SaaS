alter table public.restaurants
add column if not exists translations jsonb not null default '{}'::jsonb
check (jsonb_typeof(translations) = 'object');

alter table public.categories
add column if not exists translations jsonb not null default '{}'::jsonb
check (jsonb_typeof(translations) = 'object');

alter table public.products
add column if not exists translations jsonb not null default '{}'::jsonb
check (jsonb_typeof(translations) = 'object');

comment on column public.restaurants.translations is 'Localized restaurant content keyed by locale.';
comment on column public.categories.translations is 'Localized category content keyed by locale.';
comment on column public.products.translations is 'Localized product content keyed by locale.';
