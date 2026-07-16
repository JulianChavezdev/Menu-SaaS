# Operación en producción

Producción actual: `https://menu-saas-alpha.vercel.app`.

## Variables de Vercel

Configura en Production, Preview y Development según corresponda:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_APP_URL=https://menu-saas-alpha.vercel.app
NEXT_PUBLIC_CONTACT_EMAIL=
SUPERADMIN_EMAILS=
SUPERADMIN_USER_IDS=
SUPERADMIN_RESTAURANT_CAPACITY=25
SUPERADMIN_STORAGE_CAPACITY_GB=1
CRON_SECRET=
DEEPL_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Usa preferentemente los nombres actuales. `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` solo existen como alias heredados. La clave secreta, `CRON_SECRET`, `DEEPL_API_KEY`, `CLOUDINARY_API_SECRET` y los secretos de Stripe nunca deben tener el prefijo `NEXT_PUBLIC_`.

Las tres variables de Cloudinary activan la subida directa y la entrega automática en MP4 H.264, ancho máximo de 720 px y calidad optimizada. Si faltan, el panel utiliza automáticamente la subida reanudable de Supabase.

`DEEPL_API_KEY` activa la traducción automática español → inglés. Las claves Free terminadas en `:fx` usan automáticamente `api-free.deepl.com`; las demás usan `api.deepl.com`. Después de añadir o rotar la clave, abre Apariencia y ejecuta “Traducir ahora toda la carta” para completar el contenido histórico.

`/api/health` muestra `features.automatic_translation` como booleano para confirmar la activación sin revelar la clave.

`NEXT_PUBLIC_CONTACT_EMAIL` es opcional y deliberadamente público. Configúralo solo con una dirección de soporte que pueda mostrarse en la landing; nunca uses aquí una dirección que deba permanecer privada.

Stripe debe estar completamente configurado o completamente vacío. Mientras siga desactivado, la beta utiliza pagos manuales y no intenta cobrar al cliente.

## Supabase Auth

En Authentication → URL Configuration:

- Site URL: `https://menu-saas-alpha.vercel.app`
- Redirect URLs: `http://localhost:3000/auth/callback`, `http://localhost:3000/reset-password`, `https://menu-saas-alpha.vercel.app/auth/callback` y `https://menu-saas-alpha.vercel.app/reset-password`.

Al cambiar a un dominio propio, añade primero sus callbacks, cambia `NEXT_PUBLIC_APP_URL`, despliega y después conviértelo en Site URL.

## Base de datos y tareas programadas

Aplica las migraciones en orden y ejecuta `npm run check:db`. La migración de copias de seguridad instala una tarea diaria de Supabase a las 02:30 UTC. Vercel llama a `/api/cron/trash-cleanup` cada día a las 03:15 UTC y autentica la solicitud con `CRON_SECRET`.

La pantalla de papelera muestra el resultado de la última limpieza. Un fallo no elimina datos silenciosamente: queda registrado en la auditoría para reintento manual.

## Publicar cambios

1. Ejecuta pruebas, TypeScript, lint y build.
2. Comprueba migraciones, demo y medios con `npm run check:release` usando el entorno de producción.
3. Haz commit y push de `main`; Vercel genera un nuevo despliegue sin impedir cambios posteriores.
4. Espera a que el despliegue esté `Ready`.
5. Ejecuta `npm run check:deployment -- https://menu-saas-alpha.vercel.app`.
6. Ejecuta `npm run check:production` para confirmar traducción y mantenimiento programado.
7. Prueba el flujo afectado desde móvil y revisa `/superadmin/activity`.

## Rotación de secretos

Si una clave se comparte o se sospecha que está expuesta:

1. Genera una nueva clave en el proveedor.
2. Sustitúyela en Vercel y en el `.env.local` autorizado.
3. Fuerza un nuevo despliegue.
4. Verifica `/api/health`, acceso del superadmin y una operación de lectura.
5. Revoca la clave anterior.

No pegues el valor de los secretos en incidencias, commits, capturas o conversaciones.
