# Pruebas E2E

Playwright crea un usuario y restaurante temporales, prueba el flujo completo y los elimina al finalizar.

```bash
npm run test:e2e
```

Necesita las variables de Supabase de `.env.local` y todas las migraciones aplicadas. También comprueba logo, plantilla bloqueada, selector de idioma y traducciones reales. No se ejecuta en CI hasta configurar los secretos del repositorio.
