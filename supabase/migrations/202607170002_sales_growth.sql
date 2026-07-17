alter table public.menu_analytics_daily
drop constraint if exists menu_analytics_daily_event_type_check;

alter table public.menu_analytics_daily
add constraint menu_analytics_daily_event_type_check
check (event_type in ('menu_view','product_view','video_play','detail_open','cart_add','recommendation_add','share','contact_click'));

create table if not exists public.product_recommendations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  source_product_id uuid not null references public.products(id) on delete cascade,
  recommended_product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint product_recommendations_different_products check (source_product_id <> recommended_product_id),
  constraint product_recommendations_unique unique (source_product_id, recommended_product_id)
);

create index if not exists product_recommendations_restaurant_idx
on public.product_recommendations(restaurant_id, source_product_id, sort_order);

create or replace function public.validate_product_recommendation()
returns trigger language plpgsql set search_path=public as $$
begin
  if not exists(select 1 from public.products where id=new.source_product_id and restaurant_id=new.restaurant_id)
     or not exists(select 1 from public.products where id=new.recommended_product_id and restaurant_id=new.restaurant_id) then
    raise exception 'Recommended products must belong to the same restaurant' using errcode='23514';
  end if;
  return new;
end;
$$;

drop trigger if exists product_recommendations_validate on public.product_recommendations;
create trigger product_recommendations_validate
before insert or update on public.product_recommendations
for each row execute function public.validate_product_recommendation();

alter table public.product_recommendations enable row level security;
revoke all on public.product_recommendations from anon, authenticated;
grant select on public.product_recommendations to anon, authenticated;
grant insert, update, delete on public.product_recommendations to authenticated;

create policy "public reads published recommendations"
on public.product_recommendations for select
using (public.is_published_restaurant(restaurant_id) or public.is_member(restaurant_id));

create policy "members manage product recommendations"
on public.product_recommendations for all
using (public.can_edit(restaurant_id))
with check (public.can_edit(restaurant_id));

create or replace function public.record_menu_analytics_event(
  target_restaurant uuid,
  target_product uuid,
  target_event text,
  target_locale text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_locale text;
  event_dimension text;
begin
  if target_event not in ('menu_view','product_view','video_play','detail_open','cart_add','recommendation_add','share','contact_click') then
    raise exception 'Unsupported analytics event' using errcode = '22023';
  end if;
  if not public.is_published_restaurant(target_restaurant) then
    raise exception 'Restaurant is not publicly available' using errcode = '42501';
  end if;
  if target_event in ('product_view','video_play','detail_open','cart_add','recommendation_add') then
    if target_product is null or not exists (
      select 1 from public.products product
      where product.id = target_product
        and product.restaurant_id = target_restaurant
        and product.is_available = true
        and public.is_public_category(product.category_id, product.restaurant_id)
        and (target_event <> 'video_play' or product.video_url is not null)
    ) then
      raise exception 'Product is not publicly available' using errcode = '42501';
    end if;
  else
    target_product := null;
  end if;

  normalized_locale := case when lower(target_locale) in ('es','en') then lower(target_locale) else 'other' end;
  event_dimension := coalesce(target_product::text, 'menu');

  insert into public.menu_analytics_daily(
    restaurant_id, event_date, event_type, dimension_key, product_id, locale, event_count
  ) values (
    target_restaurant, current_date, target_event, event_dimension, target_product, normalized_locale, 1
  )
  on conflict (restaurant_id, event_date, event_type, dimension_key, locale)
  do update set event_count = public.menu_analytics_daily.event_count + 1, updated_at = now();
end;
$$;

revoke all on function public.record_menu_analytics_event(uuid, uuid, text, text) from public;
grant execute on function public.record_menu_analytics_event(uuid, uuid, text, text) to service_role;

comment on table public.product_recommendations is
'Restaurant-managed product pairings used for contextual upselling in the public menu.';

comment on table public.menu_analytics_daily is
'Privacy-safe daily sales-intent counters. No IP, cookie, user agent, device, or visitor identifier is stored.';
