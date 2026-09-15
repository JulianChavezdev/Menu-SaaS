# Pedidos para recoger desde el QR

Disponible para restaurantes con Menuly Comandas activo.

1. En **Carta**, crea el producto y pulsa **Añadir personalización**.
2. Activa la función y añade grupos (Frutas, Sabores, Toppings). Cada opción admite nombre, foto, suplemento y disponibilidad.
3. Para escoger 8 de 10 frutas, crea diez opciones y fija mínimo y máximo en 8. Guarda la configuración.
4. En **Recogidas QR**, activa los pedidos. El QR habitual de la carta permite enviarlos a cocina sin registro ni pago online.
5. Cocina recibe las cantidades, opciones y notas; marca el pedido en preparación y después listo.
6. En **Caja**, busca el número del pedido. Después de cobrar y entregar, pulsa **Confirmar cobrado y entregado**.

La personalización se activa por producto y funciona en las seis plantillas. Desactivarla conserva las opciones guardadas. Los demás productos se añaden directamente al carrito.

**Pausar nuevos pedidos** no modifica los pedidos en curso. Marcar una opción agotada impide nuevas selecciones. Las opciones y precios de pedidos ya aceptados se conservan.

El cliente conserva el seguimiento en el mismo navegador. Los reintentos del envío reutilizan un identificador para evitar duplicados. Los precios, límites y disponibilidad se validan en el servidor; el registro del pedido es transaccional.

## Validación de entrega

- Migración `202609150001_customizable_pickup.sql` aplicada en Supabase y verificada con `check:db`.
- Pruebas PostgreSQL locales: atomicidad, reintentos, cambios de producto, separación entre restaurantes, pausa, límites de envío y permisos de caja.
- Revisión en navegador a 390 px: selección de 8/10, bloqueo de una novena opción, configuración y caja.
- Apertura de la personalización y cambio de demo comprobados en las seis plantillas.
- El bloqueo de refresco conserva el desplazamiento dentro del catálogo y los paneles. La comprobación de navegador no sustituye una prueba física en cada versión de iOS/Android.
