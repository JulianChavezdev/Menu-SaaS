# Pruebas E2E

Playwright crea un usuario y restaurante temporales, prueba el flujo completo y los elimina al finalizar.

```bash
npm run test:e2e
```

Necesita las variables de Supabase de `.env.local`. No se ejecuta en CI hasta configurar los secretos del repositorio.
