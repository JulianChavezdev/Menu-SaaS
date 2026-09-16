# Pedidos desde el QR de mesa

En **Configuración de pedidos** el restaurante elige Solo carta o Pedir desde la mesa. Los pedidos requieren Menuly Comandas activo. Cada producto puede activar su propia personalización con grupos, fotos, mínimos y máximos; se usa el mismo configurador en todas las plantillas.

En **Mesas** se crean hasta 100 mesas y se descarga su QR permanente. El enlace general de la carta no permite enviar pedidos. No se emplean PIN ni geolocalización: un QR copiado puede utilizarse desde fuera durante el horario abierto. La apertura y cierre de mesas no acredita presencia física.

## Horario

Se configuran siete días, zona horaria y hasta tres franjas por día. Sin franjas significa cerrado. Un cierre anterior a la apertura termina al día siguiente; horas iguales equivalen a 24 horas. Se contemplan cambios de horario de verano. La disponibilidad se calcula en el servidor al consultar y al enviar cada pedido: no depende de un cron ni de mantener el panel abierto.

El personal puede cerrar una mesa hasta el final de la franja actual; después vuelve al horario automático. La pausa general permanece activa hasta que el restaurante la desmarque. Ocultar una mesa bloquea sus pedidos hasta volver a mostrarla.

## Cobro y cocina

- **Antes de preparar:** el cliente obtiene un número y paga al personal en el TPV del restaurante. En Cocina aparece en Por cobrar; no permite prepararlo hasta confirmar el cobro.
- **Después:** entra directamente en Cocina. Puede prepararse y entregarse; si sigue sin cobrar permanece en Por cobrar.
- **Cocina** permite buscar por mesa o número, consultar ingredientes y notas, copiar la comanda para pasarla al TPV y registrar el cobro con referencia opcional. No integra ni ejecuta cargos en un TPV externo. Cocina, propietario, administrador y editor pueden registrar el pago.
- El momento de pago queda guardado en cada pedido y no cambia al modificar la configuración.
- **Historial** permite abrir cada pedido para ver productos, opciones, notas, importes y referencia de pago.

La antigua pantalla Caja redirige a Cocina. No se aceptan nuevas recogidas desde el enlace público; se conserva el seguimiento de las anteriores.

## Despliegue

Aplicar `202609150002_restaurant_order_settings.sql` después de `202609150001_customizable_pickup.sql`, antes de desplegar esta versión. Verificar con `node scripts/check-db.mjs`. Los restaurantes quedan inicialmente en Solo carta y deben configurar sus horarios antes de activar pedidos por mesa.

La API valida origen, precios y selección en servidor. La transacción vuelve a comprobar publicación, suscripción, mesa, franja, pausas y versiones de productos; almacena opciones e importes y admite reintentos sin duplicar. La base de datos bloquea la preparación sin el pago previo requerido. Se limitan las ráfagas por mesa y origen de red dentro de esa mesa, evitando que el wifi compartido bloquee a todo el restaurante.
