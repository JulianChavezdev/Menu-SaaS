-- The free trial lasts seven days, allows five categories and one product in
-- each category. Expired trial restaurants are moved to the recoverable trash.

create or replace function public.enforce_trial_plan_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status public.subscription_state;
  current_count integer;
  category_count integer;
begin
  if tg_op = 'UPDATE' and new.restaurant_id is not distinct from old.restaurant_id then
    if tg_table_name = 'categories' then
      return new;
    elsif tg_table_name = 'products' and new.category_id is not distinct from old.category_id then
      return new;
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.restaurant_id::text, 0));
  select subscription_status into current_status
  from public.restaurants where id = new.restaurant_id;

  if current_status = 'active' then return new; end if;

  if tg_table_name = 'products' then
    select count(*) into current_count
    from public.products where restaurant_id = new.restaurant_id;
    select count(*) into category_count
    from public.products
    where restaurant_id = new.restaurant_id and category_id = new.category_id;

    if (tg_op = 'INSERT' or new.restaurant_id is distinct from old.restaurant_id)
       and current_count >= 5 then
      raise exception 'Trial plan allows at most 5 products'
        using errcode = '23514';
    end if;
    if category_count >= 1 then
      raise exception 'Trial plan allows one product per category'
        using errcode = '23514';
    end if;
  elsif tg_table_name = 'categories' then
    select count(*) into current_count
    from public.categories where restaurant_id = new.restaurant_id;
    if current_count >= 5 then
      raise exception 'Trial plan allows at most 5 categories'
        using errcode = '23514';
    end if;
  else
    raise exception 'Unsupported plan-limited table';
  end if;

  return new;
end;
$$;

create or replace function public.process_expired_trials()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.restaurants%rowtype;
  deleted_at timestamptz;
  category_rows jsonb;
  product_rows jsonb;
  membership_rows jsonb;
  subscription_rows jsonb;
  payment_rows jsonb;
  media_rows jsonb;
  affected_count integer := 0;
begin
  for target in
    select restaurant.*
    from public.restaurants restaurant
    join public.subscriptions subscription on subscription.restaurant_id = restaurant.id
    where subscription.status = 'trialing'
      and subscription.current_period_end is not null
      and subscription.current_period_end <= now()
      and restaurant.slug <> 'bistro-nube'
    order by subscription.current_period_end
    for update of restaurant
  loop
    deleted_at := now();

    select coalesce(jsonb_agg(to_jsonb(item) order by item.sort_order), '[]'::jsonb)
    into category_rows from public.categories item where item.restaurant_id = target.id;
    select coalesce(jsonb_agg(to_jsonb(item) order by item.sort_order), '[]'::jsonb)
    into product_rows from public.products item where item.restaurant_id = target.id;
    select coalesce(jsonb_agg(to_jsonb(item)), '[]'::jsonb)
    into membership_rows from public.restaurant_members item where item.restaurant_id = target.id;
    select coalesce(jsonb_agg(to_jsonb(item)), '[]'::jsonb)
    into subscription_rows from public.subscriptions item where item.restaurant_id = target.id;
    select coalesce(jsonb_agg(to_jsonb(item) order by item.paid_at), '[]'::jsonb)
    into payment_rows from public.manual_payments item where item.restaurant_id = target.id;
    select coalesce(jsonb_agg(media.path), '[]'::jsonb)
    into media_rows
    from (
      select video_path as path from public.products where restaurant_id = target.id
      union
      select image_path as path from public.products where restaurant_id = target.id
      union
      select split_part(target.logo_url, '/restaurant-media/', 2) as path
    ) media
    where media.path is not null
      and media.path like 'restaurants/' || target.id::text || '/%';

    insert into public.superadmin_audit_log(actor_user_id, restaurant_id, action, details)
    values (
      null,
      target.id,
      'restaurant.deletion_backup_created',
      jsonb_build_object(
        'deleted_at', deleted_at,
        'restore_until', deleted_at + interval '30 days',
        'restaurant_name', target.name,
        'slug', target.slug,
        'reason', 'trial_expired',
        'backup', jsonb_build_object(
          'format', 'carta-video.deleted-restaurant',
          'version', 2,
          'restaurant', to_jsonb(target),
          'categories', category_rows,
          'products', product_rows,
          'memberships', membership_rows,
          'subscriptions', subscription_rows,
          'payments', payment_rows,
          'media_paths', media_rows
        )
      )
    );

    delete from public.restaurants where id = target.id;
    insert into public.superadmin_audit_log(actor_user_id, restaurant_id, action, details)
    values (null, null, 'restaurant.trial_expired_deleted', jsonb_build_object(
      'deleted_at', deleted_at,
      'deleted_restaurant_id', target.id,
      'restaurant_name', target.name,
      'slug', target.slug
    ));
    affected_count := affected_count + 1;
  end loop;

  return affected_count;
end;
$$;

revoke all on function public.process_expired_trials() from public;
grant execute on function public.process_expired_trials() to service_role;

create or replace function public.trial_policy_version()
returns integer
language sql
stable
security definer
set search_path = public
as $$ select 20260719 $$;

revoke all on function public.trial_policy_version() from public;
grant execute on function public.trial_policy_version() to service_role;

select public.process_expired_trials();
