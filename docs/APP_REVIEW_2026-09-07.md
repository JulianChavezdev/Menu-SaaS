# Revisión de Menuly — 7 de septiembre de 2026

## Resultado

La base compila y funciona en las comprobaciones realizadas, pero las pruebas existentes dejaban pasar errores de autenticación, permisos y publicación. Las correcciones siguientes están aplicadas localmente; no se ha desplegado ni modificado la base de datos remota.

## Problemas corregidos

| Prioridad | Problema e impacto | Corrección |
| --- | --- | --- |
| Alta | El cliente Supabase de servidor ignoraba las escrituras de cookies. El callback de confirmación/recuperación podía intercambiar el código sin conservar la sesión en el navegador. | Persistencia de cookies, incluidos fragmentos, opciones y expiración; compatibilidad con Server Components de solo lectura. |
| Alta | La firma de Cloudinary aceptaba cualquier miembro del restaurante, incluidos camarero y cocina, y no comprobaba el estado de suscripción. | Autorización explícita para propietario, administrador y editor con acceso activo y sin suspensión, tanto al firmar como al asignar el vídeo. |
| Alta | La asignación de vídeo podía borrar el anterior aunque RLS impidiera actualizar filas. Repetir una asignación también podía borrar el propio vídeo recién guardado. | Exigir una fila actualizada antes de borrar y conservar el recurso cuando el identificador coincide. |
| Alta | La carta usaba un cliente privilegiado y omitía comprobar `access_suspended`. Sus metadatos tampoco verificaban la publicación. | Misma condición de acceso para carta y metadatos: publicada, sin suspensión y con suscripción habilitada. |
| Alta | Se enviaba casi toda la fila del restaurante como propiedades de un componente cliente, incluidos campos administrativos. | Proyección explícita de campos de la carta. También se retira el motivo de impago de la pantalla pública. La exposición directa de columnas por la API de base de datos requiere revisión independiente. |
| Media | `img-src` excluía Cloudinary, aunque la app genera allí miniaturas JPG. | Permitir únicamente su dominio de entrega en la directiva de imágenes. |
| Media | `Origin: null` u otros orígenes malformados provocaban excepciones en tres endpoints. | Respuesta 403 controlada en pedidos, analíticas y firma de subida. |
| Media | Dos pruebas de portada dependían de que cesara toda actividad de red. Una agotó 60 segundos aunque la página estaba renderizada. | Esperar al documento y verificar los elementos visibles; las tres pruebas pasan. |

## Pendientes prioritarios

1. **Revisar columnas accesibles directamente en Supabase.** La política `public published restaurants` permite seleccionar filas públicas completas. RLS controla filas, no qué columnas devuelve cada consulta. La corrección de propiedades del navegador no sustituye una vista/RPC pública con columnas limitadas y permisos revisados. Evidencia: `supabase/migrations/202607130005_superadmin_access.sql`. No se han probado permisos contra producción.
2. **Completar la configuración legal local.** `node scripts/check-legal.mjs` falla por ausencia de nombre del titular, identificación fiscal, domicilio y correo legal/contacto. No se ha comprobado la configuración de Vercel ni realizado una evaluación jurídica.
3. **Confirmar la rotación del secreto previamente señalado.** `docs/BETA_READINESS.md` registra esa acción pendiente. No se puede determinar con esta revisión si ya se completó.
4. **Endurecer entradas públicas frente a abuso.** Analíticas y alertas de registro no tienen un límite explícito de frecuencia en sus rutas. Pedidos y analíticas leen todo el cuerpo antes de comprobar su tamaño. Conviene limitar bytes durante la lectura y aplicar límites compartidos entre instancias.
5. **Probar permisos y flujos reales en un entorno aislado.** Gran parte de los tests comprueba cadenas presentes en archivos; eso explica que pasaran antes de estas correcciones. Se han añadido 35 pruebas de comportamiento, pero falta ejecutar integración y recorridos autenticados con usuarios de cada rol, confirmación de correo y recuperación de contraseña.

## Mejoras posteriores

- Separar `video-menu.tsx` y las acciones generales del panel por responsabilidad para facilitar cambios y revisiones de permisos.
- Reducir el alcance del middleware: también intercepta recursos públicos y llama a `getUser`. Medir primero su impacto con sesiones presentes y ajustar el matcher sin perder renovación en rutas autenticadas.
- Unificar los tipos de roles de `roles.ts` y `member-roles.ts`; actualmente solo el segundo incluye camarero y cocina.
- Proteger el login frente a errores de `localStorage`: un fallo al recordar el correo puede impedir navegar después de autenticarse.
- Actualizar la documentación: `BETA_READINESS.md` aún describe dos plantillas gratuitas y cuatro premium, mientras README describe una y cinco.

## Verificación y alcance

- Inicio: 366 pruebas unitarias correctas, TypeScript y ESLint correctos.
- Final: 401 pruebas correctas en 108 archivos; compilación de producción completada con comprobación de tipos y lint.
- Playwright: tres pruebas de portada correctas, incluida una matriz de 11 tamaños, navegación móvil y contenido de escritorio. Captura de escritorio inspeccionada.
- No se ha realizado una auditoría visual completa del panel ni una auditoría de dependencias o infraestructura desplegada.
- No se ejecutaron pruebas que crean usuarios o restaurantes remotos. Las nuevas pruebas de permisos usan servicios simulados.
- El comando global `npm` del equipo está roto por una ruta inexistente a `npm-cli.js`; se ejecutaron los binarios locales con Node. No es un fallo de la app.

Las correcciones no requieren migraciones. Antes de publicar, validar confirmación/recuperación de sesión y subida de vídeo con cuentas reales en staging.
