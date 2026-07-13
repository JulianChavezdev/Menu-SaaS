# Pruebas de integración

Necesitan las variables de Supabase de `.env.local` y todas las migraciones aplicadas. Ejecuta:

```bash
npm run test:integration
```

La suite base usa la clave pública. La prueba de endurecimiento usa la service role para crear datos temporales, valida el acceso anónimo y autenticado, y elimina usuarios y restaurantes al finalizar. Si la migración de seguridad todavía no existe, esa prueba se omite.
