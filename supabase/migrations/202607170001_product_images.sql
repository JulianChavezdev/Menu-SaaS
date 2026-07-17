create or replace function public.can_manage_restaurant_product_image(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public, storage
as $$
  with object_path as (
    select storage.foldername(object_name) as folders,
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
    join public.products product
      on product.id::text = path.folders[4]
     and product.restaurant_id = member.restaurant_id
    where path.folders[1] = 'restaurants'
      and path.folders[3] = 'products'
      and array_length(path.folders,1) = 4
      and path.filename ~ '^image-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'
      and path.extension in ('jpg','jpeg','png','webp')
  );
$$;

revoke all on function public.can_manage_restaurant_product_image(text) from public;
grant execute on function public.can_manage_restaurant_product_image(text) to authenticated, service_role;

create policy "member product image insert" on storage.objects for insert to authenticated
with check (bucket_id='restaurant-media' and public.can_manage_restaurant_product_image(name));
create policy "member product image update" on storage.objects for update to authenticated
using (bucket_id='restaurant-media' and public.can_manage_restaurant_product_image(name))
with check (bucket_id='restaurant-media' and public.can_manage_restaurant_product_image(name));
create policy "member product image delete" on storage.objects for delete to authenticated
using (bucket_id='restaurant-media' and public.can_manage_restaurant_product_image(name));
