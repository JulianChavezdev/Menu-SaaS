# Verificación manual multi-tenant

1. Crea dos usuarios y un restaurante para cada uno desde `/onboarding`.
2. Con el usuario A abre DevTools y prueba una actualización REST a un `restaurant_id` de B. Supabase debe responder sin filas actualizadas o con denegación RLS.
3. Comprueba `/r/slug-a` y `/r/slug-b`: cada URL solo debe devolver sus propios productos.
4. Con A, intenta subir a `restaurant-media/restaurants/{id-de-b}/...`; Storage debe rechazarlo.
5. Oculta una categoría y un producto: no deben aparecer en la URL pública tras recargar.

No realices estas pruebas con service role; esa clave ignora RLS y solo debe vivir en procesos de servidor de confianza.
