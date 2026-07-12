alter table public.restaurants
add column if not exists language_switcher_enabled boolean not null default false;

comment on column public.restaurants.language_switcher_enabled is
'Allows visitors to switch the public menu interface language.';
