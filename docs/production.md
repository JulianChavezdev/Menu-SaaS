# Puesta en producción

## Vercel

1. Importa `JulianChavezdev/Menu-SaaS` desde Vercel.
2. Usa Node.js 22 y el framework Next.js.
3. Añade en Production, Preview y Development: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y `NEXT_PUBLIC_APP_URL`.
4. Define `NEXT_PUBLIC_APP_URL` con la URL pública, sin barra final.
5. Despliega y comprueba `https://tu-dominio/api/health`.

La clave `SUPABASE_SERVICE_ROLE_KEY` es solo de servidor. Nunca debe usar el prefijo `NEXT_PUBLIC_`.

## Supabase Auth

En Authentication → URL Configuration configura:

- Site URL: `https://tu-dominio`
- Redirect URLs: `http://localhost:3000/auth/callback`, `http://localhost:3000/reset-password`, `https://tu-dominio/auth/callback` y `https://tu-dominio/reset-password`.

## Verificación

```bash
npm run check:env
npm test
npm run lint
npm run typecheck
npm run build
```

Después prueba registro, recuperación de contraseña, subida de vídeo, QR y una carta pública desde móvil.
