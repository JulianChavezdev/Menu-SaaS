# Estado de preparación de la beta

Actualizado: 16 de julio de 2026.

## Terminado

- Autenticación, recuperación de contraseña y selector para ver u ocultar la clave.
- Onboarding, roles y aislamiento multi-restaurante mediante RLS.
- Gestión de categorías, productos, alérgenos, disponibilidad, orden, traducción inglesa automática y vídeos.
- Carta pública mobile-first con navegación vertical, catálogo listado en dos columnas, carrito local, observaciones, descripción y alérgenos desplegables.
- Logo único, selector opcional español/inglés y siete plantillas: dos gratuitas y cinco premium.
- Plan de prueba limitado a 3 productos y 5 categorías en servidor y base de datos.
- Panel de superadmin para métricas, capacidad, soporte, previsualización, suspensión, restauración y eliminación protegida.
- Papelera con restauración temporal, purga diaria auditada y limpieza de archivos asociados.
- Exportaciones, copias versionadas y copias automáticas diarias con retención.
- Demo única `Bistro Nube` con 7 categorías y 15 productos; los fixtures de prueba se eliminan automáticamente.
- Pagos manuales genéricos, vencimientos, cortesía, suspensión en dos pasos, libro financiero y cierres mensuales.
- Central de cobros pendientes con mensajes para copiar, WhatsApp o correo y registro del último aviso preparado.
- Centro de actividad y auditoría privada con filtros y CSV.
- Analíticas globales de superadmin con visitas, vídeos, carrito, contactos, rankings y filtros de periodo.
- Landing pública completa con navegación, producto, precios, equipo, FAQ y contacto configurable.
- Checkout y webhook de Stripe implementados, pero desactivados mientras no existan todas sus variables.
- Despliegue operativo en `https://menu-saas-alpha.vercel.app`.

## Estado técnico comprobado

- `npm run check:db`: esquema remoto completo, sin migraciones pendientes.
- Pruebas unitarias, integración, TypeScript, lint y build disponibles en los scripts del proyecto.
- `npm run check:deployment -- https://menu-saas-alpha.vercel.app`: salud, portada, demo, manifest, robots, sitemap y cabeceras correctos.
- Demo remota comprobada: 1 restaurante, 7 categorías, 15 productos y 13 vídeos accesibles por debajo de 15 MB.
- 200 pruebas unitarias, 14 de integración y 7 pruebas E2E críticas superadas.
- Los secretos no se almacenan en Git y las rutas privadas requieren sesión y rol de superadmin.

## Acciones externas pendientes

1. Rotar `SUPABASE_SECRET_KEY`, porque una clave anterior se compartió fuera del almacén de secretos, y actualizarla en Supabase, Vercel y `.env.local`.
2. Confirmar que Vercel contiene `CRON_SECRET`, `NEXT_PUBLIC_APP_URL=https://menu-saas-alpha.vercel.app` y la allowlist de superadmin.
3. Crear una clave de DeepL API, guardarla como `DEEPL_API_KEY` en Vercel y ejecutar “Traducir ahora toda la carta” en los restaurantes existentes.
4. Configurar `NEXT_PUBLIC_CONTACT_EMAIL` si se quiere mostrar un correo público en la landing.
5. Revisar en un móvil real registro, recuperación de contraseña, subida de vídeo, carrito y las siete plantillas.
6. Revisar una muestra de las traducciones automáticas antes de incorporar cada restaurante.
7. Preparar la documentación comercial/legal y el canal de soporte antes de ofrecer el servicio a terceros.

## Pospuesto intencionadamente

- Activar Stripe y cobros recurrentes reales.
- Envío automático de recordatorios: durante la beta todos los mensajes requieren una acción humana.
- Nuevas iteraciones visuales y plantillas adicionales.

## Verificación de una versión

```bash
npm run check:env
npm run check:db
npm test
npm run test:integration
npm run typecheck
npm run lint
npm run build
npm run check:release
npm run check:deployment -- https://menu-saas-alpha.vercel.app
npm run check:production
```

`check:release` debe ejecutarse con un `.env.local` que use el dominio HTTPS definitivo. Para desarrollo local puede mantenerse `NEXT_PUBLIC_APP_URL=http://localhost:3000`, pero esa configuración no supera deliberadamente la comprobación de producción.

`check:production` también exige que la traducción automática y el mantenimiento programado estén activos. El endpoint de salud solo publica su estado booleano; nunca expone las claves.
