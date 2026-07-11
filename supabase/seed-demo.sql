-- Datos de demostración seguros: ejecuta este script DESPUÉS de crear un usuario
-- en Supabase Auth y sustituye el UUID siguiente por su id.
-- SELECT id, email FROM auth.users;
-- \set owner_id 'REEMPLAZAR_POR_UUID'
-- Ejecuta las inserciones desde SQL Editor sustituyendo :owner_id manualmente.

-- Cada restaurante debe crearse desde el onboarding para crear correctamente
-- restaurant_members. Estas filas sirven como guion de prueba multi-tenant:
-- Bistro Nube / bistro-nube / #7c3aed
-- Pizzería Roma / pizzeria-roma / #dc2626
-- Café Central / cafe-central / #b45309
-- La Brasa / la-brasa / #ea580c
-- Sushi Yume / sushi-yume / #0f766e

-- Ejemplo, tras reemplazar el UUID:
-- insert into public.restaurants(owner_id,name,slug,primary_color,secondary_color,is_published)
-- values ('UUID','Pizzería Roma','pizzeria-roma','#dc2626','#f59e0b',true) returning id;
-- insert into public.restaurant_members(restaurant_id,user_id,role)
-- values ('RESTAURANT_UUID','UUID','owner');
