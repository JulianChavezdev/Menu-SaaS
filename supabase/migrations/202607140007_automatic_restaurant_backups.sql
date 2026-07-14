create table if not exists public.restaurant_backups (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  reason text not null check (reason in ('daily','manual','pre_restore')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  category_count integer not null check (category_count >= 0),
  product_count integer not null check (product_count >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists restaurant_backups_history_idx
on public.restaurant_backups(restaurant_id, created_at desc);

alter table public.restaurant_backups enable row level security;
revoke all on public.restaurant_backups from anon, authenticated;

create or replace function public.build_restaurant_backup(target_restaurant uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'format', 'carta-video.restaurant-backup',
    'version', 1,
    'exportedAt', to_jsonb(now()),
    'mediaFilesIncluded', false,
    'restaurant', jsonb_build_object(
      'id', restaurant.id,
      'name', restaurant.name,
      'slug', restaurant.slug,
      'description', restaurant.description,
      'logo_url', restaurant.logo_url,
      'phone', restaurant.phone,
      'email', restaurant.email,
      'address', restaurant.address,
      'instagram_url', restaurant.instagram_url,
      'website_url', restaurant.website_url,
      'currency', restaurant.currency,
      'locale', restaurant.locale,
      'timezone', restaurant.timezone,
      'is_published', restaurant.is_published,
      'language_switcher_enabled', restaurant.language_switcher_enabled,
      'menu_template', restaurant.menu_template,
      'translations', restaurant.translations
    ),
    'categories', coalesce((
      select jsonb_agg(to_jsonb(category) order by category.sort_order, category.created_at)
      from public.categories category where category.restaurant_id = restaurant.id
    ), '[]'::jsonb),
    'products', coalesce((
      select jsonb_agg(to_jsonb(product) order by product.sort_order, product.created_at)
      from public.products product where product.restaurant_id = restaurant.id
    ), '[]'::jsonb)
  )
  from public.restaurants restaurant
  where restaurant.id = target_restaurant;
$$;

create or replace function public.create_restaurant_backup(
  target_restaurant uuid,
  backup_reason text,
  actor_user uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  backup_payload jsonb;
  backup_id uuid;
  keep_count integer;
begin
  if backup_reason not in ('daily','manual','pre_restore') then
    raise exception 'Invalid backup reason' using errcode = '22023';
  end if;
  if backup_reason <> 'daily' and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;
  if backup_reason = 'daily' and coalesce(auth.role(), '') not in ('', 'service_role') then
    raise exception 'Trusted role required' using errcode = '42501';
  end if;

  backup_payload := public.build_restaurant_backup(target_restaurant);
  if backup_payload is null then
    raise exception 'Restaurant not found' using errcode = 'P0002';
  end if;

  insert into public.restaurant_backups(restaurant_id, reason, payload, category_count, product_count, created_by)
  values (
    target_restaurant,
    backup_reason,
    backup_payload,
    jsonb_array_length(backup_payload->'categories'),
    jsonb_array_length(backup_payload->'products'),
    actor_user
  ) returning id into backup_id;

  keep_count := case backup_reason when 'daily' then 14 when 'pre_restore' then 10 else 20 end;
  delete from public.restaurant_backups old_backup
  where old_backup.restaurant_id = target_restaurant
    and old_backup.reason = backup_reason
    and old_backup.id not in (
      select recent.id from public.restaurant_backups recent
      where recent.restaurant_id = target_restaurant and recent.reason = backup_reason
      order by recent.created_at desc, recent.id desc
      limit keep_count
    );
  return backup_id;
end;
$$;

create or replace function public.run_daily_restaurant_backups()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  restaurant record;
  completed integer := 0;
begin
  for restaurant in select id from public.restaurants loop
    if not exists (
      select 1 from public.restaurant_backups backup
      where backup.restaurant_id = restaurant.id
        and backup.reason = 'daily'
        and backup.created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC'
    ) then
      perform public.create_restaurant_backup(restaurant.id, 'daily', null);
      completed := completed + 1;
    end if;
  end loop;
  return completed;
end;
$$;

revoke all on function public.build_restaurant_backup(uuid) from public;
revoke all on function public.create_restaurant_backup(uuid, text, uuid) from public;
revoke all on function public.run_daily_restaurant_backups() from public;
grant execute on function public.create_restaurant_backup(uuid, text, uuid) to service_role;
grant execute on function public.run_daily_restaurant_backups() to service_role;

create extension if not exists pg_cron with schema pg_catalog;
do $$
begin
  if not exists (select 1 from cron.job where jobname = 'carta-daily-restaurant-backups') then
    perform cron.schedule('carta-daily-restaurant-backups', '30 2 * * *', 'select public.run_daily_restaurant_backups()');
  end if;
end;
$$;

comment on table public.restaurant_backups is
'Private, restorable menu snapshots retained by reason and inaccessible to browser roles.';
