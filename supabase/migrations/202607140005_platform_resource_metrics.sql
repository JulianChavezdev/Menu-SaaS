create or replace function public.get_platform_resource_metrics()
returns table (
  storage_bytes bigint,
  video_bytes bigint,
  logo_bytes bigint,
  storage_objects bigint,
  uploaded_videos bigint,
  uploaded_logos bigint
)
language sql
stable
security definer
set search_path = public, storage
as $$
  with media as (
    select
      coalesce((object.metadata->>'size')::bigint, 0) as bytes,
      storage.foldername(object.name) as folders
    from storage.objects object
    where object.bucket_id = 'restaurant-media'
      and coalesce(object.metadata->>'size', '0') ~ '^[0-9]+$'
  )
  select
    coalesce(sum(bytes), 0)::bigint,
    coalesce(sum(bytes) filter (where folders[3] = 'products'), 0)::bigint,
    coalesce(sum(bytes) filter (where folders[3] = 'branding'), 0)::bigint,
    count(*)::bigint,
    count(*) filter (where folders[3] = 'products')::bigint,
    count(*) filter (where folders[3] = 'branding')::bigint
  from media;
$$;

revoke all on function public.get_platform_resource_metrics() from public, anon, authenticated;
grant execute on function public.get_platform_resource_metrics() to service_role;

comment on function public.get_platform_resource_metrics() is
'Returns aggregate restaurant-media usage without exposing object paths or tenant data.';
