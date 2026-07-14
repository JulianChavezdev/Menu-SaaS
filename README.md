# Carta Video

SaaS multi-tenant para que restaurantes publiquen una carta vertical en vídeo. La URL pública es `/r/[slug]`; el panel, los datos y los archivos de cada negocio se separan por `restaurant_id`.

## Arranque local

```bash
copy .env.example .env.local
npm install
npm run check:env
npm run dev
```

Configura en Supabase las Redirect URLs de Auth y el bucket público `restaurant-media`. Las políticas de Storage limitan las escrituras a miembros del restaurante, validan las rutas exactas de logos y vídeos y rechazan archivos mayores de 50 MB o con formatos no permitidos.

Variables obligatorias: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` —solo servidor— y `NEXT_PUBLIC_APP_URL`. Los alias antiguos `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` siguen admitidos durante la transición.

## Base de datos

Aplica en orden todos los archivos de `supabase/migrations`. Después comprueba el esquema remoto:

```bash
npm run check:db
```

La comprobación es de solo lectura e indica por nombre cualquier migración pendiente. Las migraciones más recientes añaden traducciones, sincronización futura de Stripe, endurecimiento de RLS, límites de prueba, aislamiento entre restaurantes y suspensión administrativa.

## Plantillas

La carta incluye siete estilos mobile-first con decoración SVG nativa: Cinemática y Brisa Mediterránea son gratuitos; Medianoche, Sakura, Taquería Solar, Bistró Art Déco y Neón Urbano requieren estado de suscripción `active`. Un restaurante sin acceso premium conserva sus datos y muestra automáticamente la plantilla gratuita predeterminada.

## Superadmin

El panel privado está en `/superadmin`. Configura al menos una allowlist exclusivamente del lado servidor:

```env
SUPERADMIN_EMAILS=tu-correo-de-acceso@ejemplo.com
# Alternativa más estable: UUID de auth.users, admite varios separados por coma
SUPERADMIN_USER_IDS=
SUPERADMIN_RESTAURANT_CAPACITY=25
SUPERADMIN_STORAGE_CAPACITY_GB=1
```

El panel permite ver métricas globales, buscar restaurantes, editar configuración y carta como soporte, cambiar plan/publicación/plantilla, suspender o restaurar acceso y consultar el historial administrativo. Una suspensión bloquea las escrituras del cliente y retira la carta pública mediante RLS; las acciones del panel usan `SUPABASE_SECRET_KEY`, que nunca debe exponerse al navegador.

Desde el detalle de cada restaurante, el superadmin puede descargar una copia JSON versionada con configuración, carta, equipo, suscripción, pagos, analíticas agregadas y auditoría, además de un CSV de productos. Las descargas requieren una sesión superadmin, no se cachean y conservan las rutas de medios sin duplicar los archivos binarios.

`SUPERADMIN_RESTAURANT_CAPACITY` controla la barra de planificación del superadmin. El valor inicial de 25 es un objetivo conservador para una beta con vídeos alojados en el plan gratuito; no bloquea altas. Debe ajustarse usando el consumo real de Storage, transferencia y base de datos, porque el número de restaurantes por sí solo no determina la carga.

`SUPERADMIN_STORAGE_CAPACITY_GB` configura el límite de referencia de la barra de Storage. El panel mide los bytes y archivos reales del bucket, muestra visualizaciones de vídeos alojados y calcula una transferencia orientativa usando el tamaño medio de esos vídeos. La transferencia es una estimación y debe compararse con el panel de consumo del proveedor.

El superadmin también construye un historial de altas de seis meses y proyecta cuándo se alcanzará el objetivo usando la media móvil de los últimos 90 días. La proyección se recalcula con los datos existentes y no requiere tareas programadas ni guarda información adicional.

La sustitución de un logo elimina el archivo anterior. Para auditar Storage manualmente, `npm run cleanup:media` simula la limpieza de archivos sin referencia; solo `npm run cleanup:media -- --apply` los elimina. El flujo E2E también retira sus propios archivos temporales.

## Planes y pagos

La beta funciona sin cobros: el plan de prueba admite hasta **3 productos y 5 categorías**. Esos límites se validan en servidor y en la base de datos.

Mientras Stripe permanezca desactivado, el superadmin puede registrar pagos manuales por Bizum, efectivo, transferencia bancaria u otro método. Cada registro conserva método, importe, fecha, referencia, nota interna y vencimiento; la confirmación activa el Plan Carta y restaura una cuenta suspendida. El restaurante ve que su suscripción es manual y nunca se inicia un cobro automático.

El control de vencimientos es deliberadamente manual: permite aplicar de 0 a 30 días de cortesía, marcar pagos pendientes sin bloquear el panel y ejecutar la suspensión solo tras una segunda confirmación. Los avisos se preparan para copiar, WhatsApp o correo, pero nunca se envían automáticamente; cada preparación queda auditada.

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
- Nunca publiques `.env.local` ni expongas `SUPABASE_SECRET_KEY`, su alias heredado `SUPABASE_SERVICE_ROLE_KEY` o secretos de Stripe.

Si una clave secreta se comparte fuera de un almacén seguro, rótala antes de producción.

## Datos y demo

Sin variables de Supabase, `/r/bistro-nube` utiliza una demo local con vídeos gastronómicos de Pexels y contenido español/inglés. Para datos persistentes, crea una cuenta y completa el onboarding.

El escaparate persistente incluye cinco restaurantes aislados, logos SVG y vídeos relacionados con cada producto. Sus páginas de procedencia quedan guardadas junto a los datos declarativos. Puede regenerarse y comprobarse de forma segura con:

```bash
npm run seed:showcase
npm run check:showcase
npm run check:media
```

## Analíticas privadas

La carta registra únicamente contadores diarios agregados: visitas, productos vistos, compartidos y clics de contacto. No existen eventos individuales ni se almacenan IP, cookies, agentes de usuario, dispositivos o identificadores de visitante. Cada restaurante solo puede leer sus propios agregados mediante RLS; la escritura pública pasa por una función limitada que valida que la carta y el producto estén publicados.

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

Antes de un despliegue ejecuta además `npm run check:release`. Esta comprobación exige el dominio HTTPS definitivo, una allowlist de superadmin, migraciones completas, demo íntegra, vídeos disponibles y una configuración de Stripe completa o totalmente desactivada.

Tras desplegar, valida el dominio público sin usar credenciales:

```bash
npm run check:deployment -- https://tu-dominio.com
```

La comprobación visita salud, portada, carta demo, manifest, robots y sitemap, y confirma las cabeceras de seguridad esenciales.

## Despliegue futuro

Antes de Vercel: aplica migraciones, rota secretos compartidos, configura variables, actualiza Redirect URLs, ejecuta todas las comprobaciones y registra el webhook solo cuando se vayan a aceptar pagos.
