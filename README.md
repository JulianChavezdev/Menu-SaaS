# Carta Video

SaaS multi-tenant para que restaurantes publiquen una carta vertical en vídeo. La URL pública es `/r/[slug]`; el panel, los datos y los archivos de cada negocio se separan por `restaurant_id`.

## Arranque local

```bash
copy .env.example .env.local
npm install
npm run check:env
npm run dev
```

Configura en Supabase las Redirect URLs de Auth y el bucket público `restaurant-media`. Las políticas de Storage limitan las escrituras a miembros del restaurante.

Variables obligatorias: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` —solo servidor— y `NEXT_PUBLIC_APP_URL`.

## Base de datos

Aplica en orden todos los archivos de `supabase/migrations`. Después comprueba el esquema remoto:

```bash
npm run check:db
```

La comprobación es de solo lectura e indica por nombre cualquier migración pendiente. Las migraciones más recientes añaden traducciones, sincronización futura de Stripe y endurecimiento de RLS, límites de prueba y aislamiento entre restaurantes.

## Planes y pagos

La beta funciona sin cobros: el plan de prueba admite hasta **3 productos y 5 categorías**. Esos límites se validan en servidor y en la base de datos.

Stripe queda preparado para una fase posterior, pero el checkout permanece desactivado mientras no existan `STRIPE_SECRET_KEY` y `STRIPE_PLAN_PRICE_ID`. Cuando se active:

1. Crea un precio recurrente en Stripe.
2. Configura las variables Stripe de `.env.example`.
3. Registra `/api/stripe/webhook` para los eventos documentados en el código.
4. Configura `STRIPE_WEBHOOK_SECRET`.
5. Verifica que `npm run check:db` no muestre migraciones pendientes.

## Seguridad

- RLS oculta restaurantes no publicados, categorías inactivas y productos no disponibles.
- Los roles se verifican en servidor y la pertenencia se valida por restaurante.
- Los campos de propietario, plan y suscripción no pueden modificarse con un cliente autenticado.
- Los límites de prueba y la relación producto-categoría se imponen en PostgreSQL.
- Las rutas de vídeos y logos se validan en servidor; el cliente no decide la URL persistida.
- Nunca publiques `.env.local` ni expongas `SUPABASE_SERVICE_ROLE_KEY` o secretos de Stripe.

Si una clave secreta se comparte fuera de un almacén seguro, rótala antes de producción.

## Datos y demo

Sin variables de Supabase, `/r/bistro-nube` utiliza una demo local con vídeos de Cloudinary y contenido español/inglés. Para datos persistentes, crea una cuenta y completa el onboarding.

## Comprobaciones

```bash
npm test
npm run test:integration
npm run test:e2e
npm run lint
npm run typecheck
npm run build
npm audit
```

Las pruebas E2E y de integración necesitan credenciales de Supabase y todas las migraciones aplicadas.

## Despliegue futuro

Antes de Vercel: aplica migraciones, rota secretos compartidos, configura variables, actualiza Redirect URLs, ejecuta todas las comprobaciones y registra el webhook solo cuando se vayan a aceptar pagos.
