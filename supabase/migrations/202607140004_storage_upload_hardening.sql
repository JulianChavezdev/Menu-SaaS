update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime']
where id = 'restaurant-media';

create or replace function public.can_manage_restaurant_media(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public, storage
as $$
  with object_path as (
    select
      storage.foldername(object_name) as folders,
      lower(storage.filename(object_name)) as filename,
      lower(storage.extension(object_name)) as extension
  )
  select exists (
    select 1
    from object_path path
    join public.restaurant_members member
      on member.restaurant_id::text = path.folders[2]
     and member.user_id = auth.uid()
     and member.role in ('owner','admin','editor')
    join public.restaurants restaurant
      on restaurant.id = member.restaurant_id
     and restaurant.access_suspended = false
    where path.folders[1] = 'restaurants'
      and (
        (
          path.folders[3] = 'branding'
          and array_length(path.folders, 1) = 3
          and path.filename ~ '^logo-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'
          and path.extension in ('jpg','jpeg','png','webp')
        )
        or (
          path.folders[3] = 'products'
          and array_length(path.folders, 1) = 4
          and path.filename ~ '^video-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(mp4|webm|mov)$'
          and path.extension in ('mp4','webm','mov')
          and exists (
            select 1 from public.products product
            where product.id::text = path.folders[4]
              and product.restaurant_id = member.restaurant_id
          )
        )
      )
  );
$$;

revoke all on function public.can_manage_restaurant_media(text) from public;
grant execute on function public.can_manage_restaurant_media(text) to authenticated, service_role;

drop policy if exists "member media insert" on storage.objects;
drop policy if exists "member media update" on storage.objects;
drop policy if exists "member media delete" on storage.objects;

create policy "member media insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'restaurant-media' and public.can_manage_restaurant_media(name));

create policy "member media update"
on storage.objects for update to authenticated
using (bucket_id = 'restaurant-media' and public.can_manage_restaurant_media(name))
with check (bucket_id = 'restaurant-media' and public.can_manage_restaurant_media(name));

create policy "member media delete"
on storage.objects for delete to authenticated
using (bucket_id = 'restaurant-media' and public.can_manage_restaurant_media(name));

comment on function public.can_manage_restaurant_media(text) is
'Validates tenant ownership and the exact logo or product-video storage path.';
