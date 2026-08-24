import type { OrderStatus } from "@/lib/table-ordering";

export type KitchenOrder = {
  id: string;
  number: string;
  status: OrderStatus;
  subtotalCents: number;
  customerNote: string | null;
  createdAt: string;
  tableName: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    note: string | null;
  }>;
};

export type KitchenOrderRow = {
  id: string;
  status: string;
  subtotal_cents: number;
  customer_note: string | null;
  created_at: string;
  restaurant_tables: { name?: string } | { name?: string }[] | null;
  dining_order_items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    note: string | null;
  }>;
};

export const kitchenOrderSelect =
  "id,status,subtotal_cents,customer_note,created_at,restaurant_tables(name),dining_order_items(id,product_name,quantity,note)";

export function mapKitchenOrders(rows: KitchenOrderRow[]): KitchenOrder[] {
  return rows.map((row) => {
    const table = Array.isArray(row.restaurant_tables)
      ? row.restaurant_tables[0]
      : row.restaurant_tables;
    return {
      id: row.id,
      number: row.id.slice(0, 6).toUpperCase(),
      status: row.status as OrderStatus,
      subtotalCents: row.subtotal_cents,
      customerNote: row.customer_note,
      createdAt: row.created_at,
      tableName: table?.name ?? "Mesa",
      items: (row.dining_order_items ?? []).map((item) => ({
        id: item.id,
        name: item.product_name,
        quantity: item.quantity,
        note: item.note,
      })),
    };
  });
}
