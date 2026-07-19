# Menuly

SaaS multi-tenant para que restaurantes publiquen una carta vertical en vídeo. La URL pública es `/r/[slug]`; el panel, los datos y los archivos de cada negocio se separan por `restaurant_id`.

## Arranque local

```bash
copy .env.example .env.local
npm install
npm run check:env
npm run dev
```

Configura en Supabase las Redirect URLs de Auth y el bucket público `restaurant-media`. Las políticas de Storage limitan las escrituras a miembros del restaurante, validan las rutas exactas de logos y vídeos y rechazan archivos mayores de 50 MB o con formatos no permitidos.

Variables obligatorias: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` —solo servidor— y `NEXT_PUBLIC_APP_URL`. En producción también se requieren `CRON_SECRET`, una allowlist de superadmin y `DEEPL_API_KEY`. Los alias antiguos `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` siguen admitidos durante la transición.

## Base de datos

Aplica en orden todos los archivos de `supabase/migrations`. Después comprueba el esquema remoto:

```bash
npm run check:db
```

La comprobación es de solo lectura e indica por nombre cualquier migración pendiente. También valida alérgenos y la eliminación recuperable al vencer la prueba de siete días. Las migraciones más recientes añaden traducciones, sincronización futura de Stripe, endurecimiento de RLS, límites de prueba, aislamiento entre restaurantes y suspensión administrativa.

## Plantillas e idiomas

La carta incluye siete estilos mobile-first con decoración SVG nativa: Cinemática y Brisa Mediterránea son gratuitos; Medianoche, Sakura, Taquería Solar, Bistró Art Déco y Neón Urbano requieren estado de suscripción `active`. Un restaurante sin acceso premium conserva sus datos y muestra automáticamente la plantilla gratuita predeterminada.

El restaurante escribe nombres y descripciones únicamente en español. Al guardar, el servidor genera automáticamente `translations.en` mediante DeepL; la clave privada nunca llega al navegador. Activar el selector de idioma vuelve a traducir la carta completa, y Apariencia incluye un botón para regenerar categorías, productos y descripción del restaurante cuando sea necesario. Si el proveedor no está configurado o no responde, el contenido español se guarda; un texto recién editado hace fallback al español para no mostrar una traducción antigua.

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

El mismo panel permite validar y restaurar una copia JSON sobre su restaurante de origen. Antes de aplicar muestra los cambios, exige confirmar el slug y ejecuta la sustitución de configuración visible, categorías y productos de forma atómica. Conserva propietario, slug, miembros, cobros, plan, suspensión, analíticas y auditoría; los medios siguen siendo referencias externas y no se recuperan si el archivo original ya no existe.

Supabase conserva además un historial privado y restituible: 14 copias diarias, 20 manuales y 10 creadas automáticamente antes de restaurar. La tarea programada se ejecuta a las 02:30 UTC, cada tipo elimina sus versiones más antiguas al superar su retención y ningún rol del navegador puede leer la tabla. El historial permite previsualizar, descargar y eliminar copias desde el detalle de superadmin.

`SUPERADMIN_RESTAURANT_CAPACITY` controla la barra de planificación del superadmin. El valor inicial de 25 es un objetivo conservador para una beta con vídeos alojados en el plan gratuito; no bloquea altas. Debe ajustarse usando el consumo real de Storage, transferencia y base de datos, porque el número de restaurantes por sí solo no determina la carga.

`SUPERADMIN_STORAGE_CAPACITY_GB` configura el límite de referencia de la barra de Storage. El panel mide los bytes y archivos reales del bucket, muestra visualizaciones de vídeos alojados y calcula una transferencia orientativa usando el tamaño medio de esos vídeos. La transferencia es una estimación y debe compararse con el panel de consumo del proveedor.

El superadmin también construye un historial de altas de seis meses y proyecta cuándo se alcanzará el objetivo usando la media móvil de los últimos 90 días. La proyección se recalcula con los datos existentes y no requiere tareas programadas ni guarda información adicional.

La sustitución de un logo elimina el archivo anterior. Para auditar Storage manualmente, `npm run cleanup:media` simula la limpieza de archivos sin referencia; solo `npm run cleanup:media -- --apply` los elimina. El flujo E2E también retira sus propios archivos temporales.

## Planes y pagos

La prueba dura **7 días** y admite **1 producto por categoría**, con un máximo de **5 categorías**. Al vencer, el restaurante y su carta se eliminan automáticamente y permanecen 30 días en la papelera administrativa antes del borrado definitivo. Estos límites se validan en servidor y en la base de datos.

Cada producto admite los 14 grupos de alérgenos del anexo II del Reglamento (UE) 1169/2011. El restaurante los selecciona desde Carta y el cliente los consulta en una pestaña desplegable con aviso de confirmación al personal. La carta pública ofrece además una vista listada por categorías, con miniaturas y productos en dos columnas, accesible desde el control Carta.

Mientras Stripe permanezca desactivado, el superadmin puede registrar pagos manuales por Bizum, efectivo, transferencia bancaria u otro método. Cada registro conserva método, importe, fecha, referencia, nota interna y vencimiento; la confirmación activa el Plan Carta y restaura una cuenta suspendida. El restaurante ve que su suscripción es manual y nunca se inicia un cobro automático.

El control de vencimientos es deliberadamente manual: permite aplicar de 0 a 30 días de cortesía, marcar pagos pendientes sin bloquear el panel y ejecutar la suspensión solo tras una segunda confirmación. Los avisos se preparan para copiar, WhatsApp o correo, pero nunca se envían automáticamente; cada preparación queda auditada.

`/superadmin/finance` centraliza los vencimientos próximos y atrasados, los prioriza por urgencia y muestra el último aviso preparado. Los botones solo copian el mensaje o abren el canal elegido; el envío final siempre depende del superadmin.

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

El escaparate persistente está consolidado en `Bistro Nube`: un único restaurante demo con siete categorías, quince productos, veintiuna recomendaciones comerciales, logo SVG y vídeos relacionados con la comida. Puede regenerarse y comprobarse de forma segura con:

```bash
npm run seed:showcase
npm run check:showcase
npm run check:media
npm run check:showcase-sales
```

## Analíticas privadas

La carta registra únicamente contadores diarios agregados: visitas, productos vistos, reproducciones de vídeo, detalles abiertos, añadidos al carrito, añadidos desde recomendaciones, compartidos y clics de contacto. No existen eventos individuales ni se almacenan IP, cookies, agentes de usuario, dispositivos o identificadores de visitante. Cada restaurante solo puede leer sus propios agregados mediante RLS; la escritura pública pasa por una función limitada que valida que la carta y el producto estén publicados.

`/dashboard/analytics` presenta tasas de intención, embudo, categorías, rendimiento por producto y oportunidades de mejora. Permite comparar 7, 30 o 90 días con el periodo anterior y descargar un CSV privado. Los añadidos son señales de intención guardadas localmente, no ventas confirmadas.

`/superadmin/analytics` reúne todas las cartas con filtros de periodo, actividad diaria, tasas del embudo, ranking de restaurantes y productos, idiomas y desglose de vídeo/carrito. Los eventos nuevos no reconstruyen actividad histórica anterior a su despliegue.

## Venta adicional y onboarding

Cada producto puede recomendar hasta tres acompañamientos, bebidas o postres del mismo restaurante. La carta los muestra dentro del detalle con precio y acceso directo al carrito. La relación está protegida por RLS y validación de pertenencia al restaurante.

El inicio del panel incluye una guía persistente de cinco pasos: logo, datos del local, primer producto, contenido visual y publicación. El progreso se calcula desde datos reales y siempre enlaza a la siguiente tarea pendiente.

Analíticas incluye además un embudo desde la visita hasta el carrito, un resumen de los últimos siete días, recomendaciones accionables, objetivos semanales editables y un enlace para compartirlo por WhatsApp. El inicio reúne alertas priorizadas sobre publicación, prueba, contenido incompleto, tráfico y conversión. Suscripción incorpora un buzón privado de sugerencias; el superadmin puede clasificarlas, anotar decisiones y marcar su estado desde `/superadmin/feedback`, cuyo contador indica las pendientes.

## Landing pública

La portada incluye navegación responsive, presentación del producto, funcionamiento, precios, quiénes somos, preguntas frecuentes y contacto. `NEXT_PUBLIC_CONTACT_EMAIL` es opcional: cuando existe muestra el enlace de correo; si está vacío, la llamada a contacto dirige al registro o acceso sin publicar una dirección personal.

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

## Producción actual

La aplicación está desplegada en `https://menuly.es`. Para cada versión: ejecuta las comprobaciones, sube `main`, espera a que Vercel marque el despliegue como `Ready` y valida el dominio con `check:deployment`. Mantén `CRON_SECRET` configurado para proteger la limpieza diaria de la papelera y registra el webhook de Stripe únicamente cuando vayas a aceptar cobros reales.

El manual visual para restaurantes se publica en `/manual-menuly-restaurantes.pdf`. Se regenera desde su fuente vectorial con `npm run manual:generate`; el resultado final se guarda tanto en `output/pdf/` como en `public/`.
