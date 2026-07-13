# Estado de preparación de la beta

Actualizado: 13 de julio de 2026.

## Terminado

- Autenticación, recuperación de contraseña y selector de visibilidad de clave.
- Onboarding y separación multi-restaurante.
- Gestión de categorías, productos, disponibilidad, orden y vídeos.
- Logo único; portada, colores y selector de imagen retirados del flujo activo.
- Carta pública mobile-first con navegación vertical por pantalla, controles fijos y dos plantillas.
- Selector opcional español/inglés con traducciones de contenido y fallback al español.
- Código QR, datos del restaurante, enlaces y equipo con roles.
- Plan de prueba de 3 productos y 5 categorías.
- Checkout y webhook de Stripe preparados pero desactivados durante la beta.
- RLS reforzado, campos de facturación protegidos y aislamiento categoría-producto por restaurante.
- Pruebas unitarias, integración, E2E, build, auditoría de dependencias y comprobaciones de entorno/esquema.

## Acciones externas pendientes

1. Aplicar las migraciones que indique `npm run check:db`.
2. Rotar `SUPABASE_SERVICE_ROLE_KEY` antes de producción porque una clave se compartió en una conversación.
3. Ejecutar `npm run test:integration` y `npm run test:e2e` después de las migraciones.
4. Revisar visualmente los textos y traducciones reales cargados por el restaurante.

## Pospuesto intencionadamente

- Despliegue en Vercel.
- Cobros reales, Stripe en producción y cualquier proceso manual por Bizum.
- Nuevas plantillas de pago.
- Automatización o traducción con IA.

## Comando de reanudación

```bash
npm run check:env
npm run check:db
npm test
npm run typecheck
npm run lint
npm run build
```
