# Carta Video

SaaS multi-tenant para que restaurantes publiquen una carta vertical en vídeo. La URL pública es `/r/[slug]`; el panel, los datos y los archivos de cada negocio se separan por `restaurant_id`.

## Arranque

```bash
copy .env.example .env.local
npm install
npm run dev
```

Configura Supabase y aplica todas las migraciones de `supabase/migrations`. Configura también las URLs de Auth (`http://localhost:3000` y la URL de producción) y el bucket `restaurant-media`.

Variables básicas: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (solo servidor) y `NEXT_PUBLIC_APP_URL`.

## Suscripciones con Stripe

El plan de prueba funciona sin Stripe. Para habilitar el Checkout del Plan Carta:

1. Crea en Stripe un precio recurrente para el Plan Carta.
2. Configura `STRIPE_SECRET_KEY` y `STRIPE_PLAN_PRICE_ID` en el servidor.
3. Publica el endpoint `https://tu-dominio.com/api/stripe/webhook` en Stripe Workbench.
4. Suscribe el endpoint a estos eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copia el secreto del endpoint en `STRIPE_WEBHOOK_SECRET`.
6. Aplica `202607130002_stripe_webhook_events.sql` antes de recibir eventos.

Para pruebas locales puede utilizarse Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

El Checkout se crea exclusivamente en servidor. El webhook verifica la firma sobre el cuerpo original, evita procesar dos veces el mismo evento y sincroniza `subscriptions` y `restaurants.subscription_status`. Solo el estado `active` concede las ventajas profesionales.

## Seguridad

Todas las tablas tienen RLS. Las lecturas públicas solo ven restaurantes publicados, categorías activas y productos disponibles. Las escrituras se validan por pertenencia a `restaurant_members`. Storage limita las rutas a miembros del restaurante (`restaurants/{restaurant_id}/...`). Nunca expongas la service role key ni las claves secretas de Stripe.

## Datos y pruebas

El modo sin variables ofrece una demo visual de **Bistro Nube** en `/r/bistro-nube`. Para datos persistentes, crea una cuenta, completa onboarding y carga tus datos en Supabase. `seed.sql` y `seed-demo.sql` son plantillas: reemplaza el `owner_id` por un UUID de `auth.users` antes de ejecutarlas.

Los recursos demo vienen de Unsplash y Cloudinary. La estructura recomendada para archivos propios es `restaurants/{restaurant_id}/products/{product_id}/video.mp4`.

## Despliegue

Despliega en Vercel, añade las variables de `.env.example`, aplica las migraciones y actualiza las Redirect URLs de Supabase. Después registra el webhook de producción en Stripe.

## Comprobaciones

```bash
npm test
npm run test:integration
npm run test:e2e
npm run lint
npm run typecheck
npm run build
```
