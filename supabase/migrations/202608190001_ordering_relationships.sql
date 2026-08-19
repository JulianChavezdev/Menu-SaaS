-- Evita relaciones duplicadas en PostgREST. Las claves compuestas mantienen
-- el aislamiento por restaurante y conservan las mismas reglas de borrado.

alter table public.table_sessions
  drop constraint if exists table_sessions_table_id_fkey;

alter table public.dining_orders
  drop constraint if exists dining_orders_table_id_fkey,
  drop constraint if exists dining_orders_table_session_id_fkey;

alter table public.dining_order_items
  drop constraint if exists dining_order_items_order_id_fkey;
