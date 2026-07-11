# Carta Video

SaaS multi-tenant para que restaurantes publiquen una carta vertical en vídeo sin mantener una aplicación por cliente. La URL pública es `/r/[slug]`; el panel, los datos y los archivos de cada negocio se separan por `restaurant_id`.

## Arranque

```bash
copy .env.example .env.local
npm install
npm run dev
```

Después de configurar Supabase, ejecuta `supabase db push` para aplicar `supabase/migrations/202607100001_initial_schema.sql`. Configura las URLs de Auth (`http://localhost:3000` y la URL de producción) en Supabase. Crea el bucket `restaurant-media` si no se crea durante la migración.

Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (solo servidor), `NEXT_PUBLIC_APP_URL` y las variables Stripe documentadas en `.env.example`. Stripe está preparado como configuración futura; no es necesario para usar el plan de prueba.

## Seguridad

Todas las tablas tienen RLS. Las lecturas públicas solo ven restaurantes publicados, categorías activas y productos disponibles. Las escrituras se validan por pertenencia a `restaurant_members` mediante `can_edit(restaurant_id)`. Storage limita las rutas a miembros del restaurante (`restaurants/{restaurant_id}/...`). Nunca expongas la service role key.

## Datos y pruebas

El modo sin variables ofrece una demo visual de **Bistro Nube** en `/r/bistro-nube`. Para datos persistentes, crea una cuenta, completa onboarding y carga tus datos en Supabase. `seed.sql` y `seed-demo.sql` son plantillas: reemplaza el `owner_id` por un UUID de `auth.users` antes de ejecutarlo. Para probar aislamiento crea Pizzería Roma, Café Central, La Brasa y Sushi Yume con slugs distintos y usuarios distintos; RLS evita que cada usuario edite los recursos de los demás. Consulta `docs/manual-verification.md` para el guion de comprobación.

Los recursos demo de la interfaz vienen de Unsplash; sustitúyelos por vídeos/imágenes subidos a `restaurant-media`. La estructura recomendada es `restaurants/{restaurant_id}/products/{product_id}/video.mp4`.

## Despliegue

Despliega en Vercel, añade las variables de `.env.example` y actualiza las Redirect URLs de Supabase. Añade Stripe más adelante con un webhook servidor que mantenga `subscriptions` sincronizada.

## Comprobaciones

```bash
npm run lint
npm run typecheck
npm run build
```
