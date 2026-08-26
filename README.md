# Menuly

Menuly es un SaaS multi-tenant para restaurantes que combina una carta digital visual, gestión de catálogo, analíticas y un sistema opcional de comandas para camareros y Cocina.

Producción: [menuly.es](https://menuly.es)

Demo pública: [menuly.es/r/bistro-nube](https://menuly.es/r/bistro-nube)

## Producto

### Carta digital

- Carta pública mobile-first en `/r/[slug]`.
- Productos con imagen, vídeo, descripción, precio y alérgenos.
- Navegación vertical por productos y horizontal por categorías.
- Vista de vídeo y vista listada.
- Carrito local con cantidades y observaciones, sin envío a Cocina.
- Recomendaciones de acompañamientos, bebidas y postres.
- Traducción automática español–inglés mediante DeepL.
- Selector de idioma configurable por restaurante.
- Cambio de nombre y slug con conservación de alias anteriores.
- QR general para acceder a la carta.

### Plantillas

La carta dispone actualmente de seis plantillas:

- Cinemática — gratuita.
- NoirLuxe — premium.
- Street — premium.
- Cozy Corner — premium.
- Tokyo Pulse — premium.
- Social HUD — premium.

Todas comparten las funciones de carrito, descripciones, alérgenos, categorías y navegación. El vídeo o la imagen del plato mantiene la máxima prioridad visual.

### Menuly Comandas

El plan de 59,99 €/mes añade un flujo operativo para el personal:

- Comandero móvil en `/dashboard/pos`.
- Selección directa de mesa, sin abrir o cerrar sesiones manualmente.
- Catálogo reutilizado desde la carta: categorías, productos, precios e imágenes.
- Buscador, cantidades, modificaciones por producto y observación general.
- Envío directo a Cocina con protección contra comandas duplicadas.
- Pantalla de Cocina en `/dashboard/kitchen` con actualización automática, aviso sonoro y estados.
- Organización de mesas, historial y analíticas de comandas.

Menuly Comandas no procesa cobros, no emite facturas y no sustituye un TPV fiscal.

### Panel del restaurante

- Gestión conjunta de categorías y productos.
- Subida de imágenes y vídeos, incluidos `.mov` compatibles.
- Generación automática de miniaturas desde vídeos.
- Disponibilidad, destacados, orden, alérgenos y venta adicional.
- Apariencia, logo y selección de plantilla.
- Equipo con roles y aislamiento por restaurante.
- Analíticas de visitas, reproducciones, aperturas, carrito y conversión.
- Objetivos semanales, recomendaciones accionables y resumen compartible.
- Estado de suscripción, pagos manuales y buzón de sugerencias.
- Onboarding guiado y checklist calculado con datos reales.

### Superadmin

El panel privado `/superadmin` permite:

- Consultar restaurantes, altas, capacidad y analíticas globales.
- Acceder a cada carta y prestar soporte sobre su configuración.
- Gestionar publicación, suspensión, plan y primer mes gratuito.
- Registrar pagos manuales por efectivo, Bizum, transferencia u otro método.
- Gestionar vencimientos, avisos y seguimiento comercial.
- Exportar datos, crear copias, restaurarlas y recuperar restaurantes eliminados.
- Revisar sugerencias de clientes y auditoría administrativa.

El acceso depende exclusivamente de `SUPERADMIN_EMAILS` o `SUPERADMIN_USER_IDS` configurados en servidor.

## Planes actuales

| Plan | Precio | Incluye |
| --- | ---: | --- |
| Plan Carta | 34,99 €/mes | Carta visual, QR, plantillas, idiomas, carrito y analíticas |
| Menuly Comandas | 59,99 €/mes | Todo Carta, comandero móvil, mesas, Cocina e historial |
| Configuración completa | 149,99 € | Grabación, edición con IA, montaje, primer mes incluido y segundo mes gratis |

Las cuentas nuevas permanecen pendientes hasta la activación manual. Los cobros automáticos con Stripe permanecen desactivados; actualmente la activación y los pagos se gestionan manualmente. El Plan Carta cuesta 34,99 €/mes o 344,30 €/año en un único pago.

## Arquitectura

- Next.js 15 con App Router y Server Actions.
- React 19, TypeScript y Tailwind CSS.
- Supabase Auth, PostgreSQL, RLS, Realtime y Storage.
- Cloudinary para entrega y transformación multimedia.
- DeepL para traducción automática.
- Vercel para despliegue y tareas programadas.
- Vitest para pruebas unitarias y Playwright para E2E.

Los datos se aíslan por `restaurant_id`. Las comprobaciones de pertenencia, rol, plan y estado de publicación se realizan en servidor y en PostgreSQL mediante RLS.

## Arranque local

Requisitos: Node.js 20 o superior, npm y un proyecto de Supabase.

```bash
git clone git@github.com:JulianChavezdev/Menu-SaaS.git
cd Menu-SaaS
npm install
copy .env.example .env.local
npm run check:env
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Variables de entorno

Obligatorias:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Producción y funciones adicionales:

```env
CRON_SECRET=
DEEPL_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SUPERADMIN_EMAILS=
SUPERADMIN_USER_IDS=
SUPERADMIN_RESTAURANT_CAPACITY=25
SUPERADMIN_STORAGE_CAPACITY_GB=1
NEXT_PUBLIC_CONTACT_EMAIL=
NEXT_PUBLIC_LEGAL_NAME=
NEXT_PUBLIC_LEGAL_TAX_ID=
NEXT_PUBLIC_LEGAL_ADDRESS=
NEXT_PUBLIC_LEGAL_EMAIL=
NEXT_PUBLIC_LEGAL_PHONE=
```

Consulta `.env.example` para ver también las variables Stripe reservadas para una fase posterior. Nunca expongas `SUPABASE_SECRET_KEY`, `CLOUDINARY_API_SECRET`, `DEEPL_API_KEY` ni `CRON_SECRET` en variables públicas.

## Supabase

Aplica en orden todos los archivos de `supabase/migrations`. Después valida el esquema remoto:

```bash
npm run check:db
```

Configura también:

- Redirect URLs de Supabase Auth para localhost y el dominio definitivo.
- Bucket público `restaurant-media`.
- Realtime para las tablas incluidas por las migraciones.
- Políticas de Storage y RLS incluidas en el proyecto.

El comandero actual reutiliza la infraestructura de comandas existente y crea internamente la sesión técnica necesaria; el camarero nunca tiene que gestionarla.

## Datos de demostración

`Bistro Nube` es el restaurante de demostración consolidado. Puede verificarse o regenerarse con:

```bash
npm run seed:showcase
npm run check:showcase
npm run check:media
npm run check:showcase-sales
```

Sin variables de Supabase, `/r/bistro-nube` utiliza los datos locales de `src/lib/demo.ts`.

## Comprobaciones

```bash
npm run typecheck
npm run lint
npm test
npm run test:integration
npm run test:e2e
npm run build
```

Las pruebas de integración y E2E necesitan credenciales de Supabase y todas las migraciones aplicadas.

Antes de publicar:

```bash
npm run check:release
```

Después del despliegue:

```bash
npm run check:production
```

## Despliegue

La rama `main` está conectada con Vercel. El flujo habitual es:

1. Ejecutar pruebas, lint, TypeScript y build.
2. Crear commits pequeños y descriptivos.
3. Subir `main` a GitHub.
4. Esperar a que Vercel marque el despliegue como `Ready`.
5. Ejecutar `npm run check:production`.

## Seguridad y operación

- Nunca subas `.env.local` al repositorio.
- Rota inmediatamente cualquier secreto compartido fuera de un almacén seguro.
- Las operaciones de superadmin usan la clave secreta únicamente en servidor.
- Las rutas multimedia, límites y propiedad del restaurante se validan antes de persistir datos.
- La analítica pública guarda contadores agregados, no perfiles individuales de comensales.
- Los pagos manuales, suspensiones, restauraciones y operaciones sensibles quedan auditados.

## Estructura principal

```text
src/app/                 Rutas, páginas, API y Server Actions
src/components/          Interfaz pública, dashboard y superadmin
src/lib/                 Dominio, permisos, analíticas y utilidades
supabase/migrations/     Esquema, funciones, RLS y políticas
scripts/                 Verificación, mantenimiento y datos demo
tests/                   Pruebas unitarias, integración y E2E
public/                  Recursos públicos
```

## Estado

Menuly está en desarrollo activo y desplegado en producción. El sistema admite modificaciones continuas: cada cambio validado y enviado a `main` genera una nueva versión en Vercel sin impedir futuras mejoras.
