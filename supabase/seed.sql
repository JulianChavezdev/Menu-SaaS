-- Demo data has no auth owner so it is public only. Apply after migration.
insert into public.restaurants(id,owner_id,name,slug,description,is_published,primary_color,secondary_color) values ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Bistro Nube','bistro-nube','Una carta que flota entre sabores.',true,'#7c3aed','#ec4899');
-- To seed against a fresh Supabase project, replace owner_id with an actual auth.users UUID.
