import type { OrderStatus } from "@/lib/table-ordering";
import type {OptionSnapshot} from "./product-customization";

export type KitchenOrder = {
  id: string;
  number: string;
  status: OrderStatus;
  subtotalCents: number;
  customerNote: string | null;
  createdAt: string;
  tableName: string;
  fulfillment?: "table"|"pickup";
  paymentStatus?: "unpaid"|"paid";
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    note: string | null;
    options?: OptionSnapshot[];
  }>;
};

export type KitchenOrderRow = {
  id: string;
  status: string;
  subtotal_cents: number;
  customer_note: string | null;
  created_at: string;
  fulfillment?: "table"|"pickup";
  payment_status?: "unpaid"|"paid";
  restaurant_tables: { name?: string } | { name?: string }[] | null;
  dining_order_items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    note: string | null;
    selected_options?: OptionSnapshot[];
  }>;
};

export const kitchenOrderSelect =
  "id,status,subtotal_cents,customer_note,created_at,fulfillment,payment_status,restaurant_tables(name),dining_order_items(id,product_name,quantity,note,selected_options)";

export function mapKitchenOrders(rows: KitchenOrderRow[]): KitchenOrder[] {
  return rows.map((row) => {
    const table = Array.isArray(row.restaurant_tables)
      ? row.restaurant_tables[0]
      : row.restaurant_tables;
    return {
      id: row.id,
      number: row.id.slice(0, row.fulfillment==="pickup"?8:6).toUpperCase(),
      ...(row.fulfillment?{fulfillment:row.fulfillment,paymentStatus:row.payment_status}:{}),
      status: row.status as OrderStatus,
      subtotalCents: row.subtotal_cents,
      customerNote: row.customer_note,
      createdAt: row.created_at,
      tableName: row.fulfillment==="pickup"?"Recoger en caja":table?.name ?? "Mesa",
      items: (row.dining_order_items ?? []).map((item) => ({
        id: item.id,
        name: item.product_name,
        quantity: item.quantity,
        note: item.note,
        ...(item.selected_options?{options:item.selected_options}:{}),
      })),
    };
  });
}
