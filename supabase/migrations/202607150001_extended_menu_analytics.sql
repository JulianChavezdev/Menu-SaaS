alter table public.menu_analytics_daily
drop constraint if exists menu_analytics_daily_event_type_check;

alter table public.menu_analytics_daily
add constraint menu_analytics_daily_event_type_check
check (event_type in ('menu_view','product_view','video_play','cart_add','share','contact_click'));

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
  if target_event not in ('menu_view','product_view','video_play','cart_add','share','contact_click') then
    raise exception 'Unsupported analytics event' using errcode = '22023';
  end if;
  if not public.is_published_restaurant(target_restaurant) then
    raise exception 'Restaurant is not publicly available' using errcode = '42501';
  end if;
  if target_event in ('product_view','video_play','cart_add') then
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

comment on table public.menu_analytics_daily is
'Privacy-safe daily counters, including video plays and cart additions. No IP, cookie, user agent, device, or visitor identifier is stored.';
