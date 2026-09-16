# Auditoría de seguridad — 16 de septiembre de 2026

Alcance: código de la aplicación, rutas públicas, configuración HTTP, permisos de restaurantes, creación de pedidos y dependencias de producción. Se revisaron SQL/RLS, validación de entradas, enlaces restaurados, autenticación y aislamiento entre restaurantes. No es una certificación ni un análisis exhaustivo de la infraestructura o de las cuentas de los proveedores.

## Hallazgos corregidos

| Prioridad | Hallazgo | Corrección |
| --- | --- | --- |
| Alta | Una política de lectura permitía consultar columnas administrativas de restaurantes publicados mediante REST anónimo. Se confirmó una fila accesible sin imprimir sus datos. | Lectura de configuración restringida a miembros. La carta pública sigue usando una proyección explícita desde el servidor. El sitemap solo publica URL y fecha de actualización. |
| Alta | El INSERT directo de restaurantes permitía al propietario proporcionar campos de sistema; el trigger anterior solo protegía UPDATE. Algunos campos de suspensión tampoco estaban protegidos. | Eliminada la política de INSERT directo; el alta legítima pasa por la acción autenticada del servidor. Ampliada la protección de los campos administrativos. |
| Media | La alerta de registro aceptaba una identidad enviada por un visitante sin sesión. | Identidad obtenida de `auth.getUser()`, respuesta 401 sin sesión, control de origen y ventana de registro reciente. |
| Media | Los enlaces importados en copias de seguridad admitían esquemas ejecutables. No se confirmó una ejecución efectiva, porque React también aplica defensas. | Validación HTTP/HTTPS al importar y guardar, rechazo de esquemas ejecutables, credenciales y caracteres de control; validación adicional al renderizar enlaces. |
| Refuerzo | La política de scripts permitía scripts inline de forma general. | Nonce aleatorio por respuesta, `strict-dynamic`, bloqueo de manejadores inline y de eval en producción. |
| Integridad | La configuración de pago podía quedarse antigua en la carta y cambiar entre la confirmación y la escritura del pedido. | Sincronización durante toda la visita, al volver a la pestaña y cada cuatro segundos; comprobación antes de enviar, en la API y dentro de la transacción con bloqueo de la configuración. |

Los pedidos ya confirmados conservan su modalidad original. La nueva modalidad se aplica a pedidos nuevos. La función SQL anterior queda accesible solo al servidor para permitir el despliegue compatible; los visitantes no pueden invocar ninguna de las dos firmas.

## Comprobaciones

- 466 pruebas unitarias y de base de datos local correctas, incluidas manipulación de condiciones de pago en ambos sentidos, aislamiento de restaurantes y campos protegidos.
- Cadenas de prueba con SQL y HTML se conservan como texto; no se encontró concatenación de entradas del usuario en SQL dinámico ni renderizado arbitrario mediante `dangerouslySetInnerHTML` en las superficies revisadas.
- Compilación de producción y comprobación de TypeScript correctas. ESLint sin errores; permanece una advertencia de imagen en una prueba preexistente.
- `npm audit --omit=dev`: cero vulnerabilidades conocidas notificadas en las dependencias de producción en esta fecha.
- Navegador: cambio de plantilla funcional con CSP; actualización del pago con carrito cerrado y rechazo de condiciones obsoletas sin enviar pedidos.
- HTTP local de producción: nonces distintos entre respuestas, todos los scripts de inicio con nonce coincidente y endpoint de alertas devolviendo 401 sin sesión.
- Migraciones aplicadas en Supabase y comprobación del esquema correcta. La consulta anónima de configuración devuelve cero filas. Prueba de integración con dos cuentas temporales correcta: separación entre restaurantes, configuración visible al propietario, rechazo de altas directas y de cambios de campos protegidos; datos de prueba eliminados al finalizar.

La protección mediante nonces exige renderizado dinámico del HTML; los recursos estáticos conservan su caché. Referencia: [documentación oficial de CSP de Next.js 15](https://nextjs.org/docs/15/app/guides/content-security-policy).

## Límites y puntos pendientes

- Un QR estático copiado puede utilizarse fuera del local mientras la mesa esté abierta. Es una limitación del sistema de apertura por horarios elegido; no acredita presencia física.
- Los pedidos tienen límites transaccionales de frecuencia. Los eventos de analítica siguen necesitando una política distribuida de cuotas o protección equivalente del proveedor frente a automatización masiva; el control de origen por sí solo no evita bots.
- Una auditoría y un análisis de dependencias reducen riesgos, pero no garantizan ausencia absoluta de vulnerabilidades. No se realizaron pruebas de carga ni ataques destructivos sobre producción.
