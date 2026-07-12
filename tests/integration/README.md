# Pruebas de integración

Necesitan `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en el entorno. Ejecuta:

```bash
npm run test:integration
```

Las pruebas usan únicamente la clave pública. No crean datos persistentes y comprueban que RLS bloquee escrituras anónimas y que los restaurantes demo permanezcan aislados.
