alter table public.restaurants
add column if not exists menu_template text not null default 'cinematic';

comment on column public.restaurants.menu_template is
'Stable key of the public menu template selected by the restaurant.';
