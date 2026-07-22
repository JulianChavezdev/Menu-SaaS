# Pruebas de integración

Necesitan las variables de Supabase de `.env.local` y todas las migraciones aplicadas. Ejecuta:

```bash
npm run test:integration
```

La suite base usa la clave pública. Las pruebas protegidas usan la service role para crear datos temporales, validan aislamiento, acceso de pago, restauración e historial de slugs, y eliminan usuarios y restaurantes al finalizar. Si una migración requerida todavía no existe, la comprobación correspondiente se omite o falla señalando el esquema pendiente.
