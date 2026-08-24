import { describe, expect, it } from "vitest";
import { mapKitchenOrders } from "../src/lib/kitchen-orders";

describe("kitchen order mapping", () => {
  it("preserves table, customer note and item modifications", () => {
    const [order] = mapKitchenOrders([
      {
        id: "12345678-0000-4000-8000-000000000001",
        status: "pending",
        subtotal_cents: 1890,
        customer_note: "Servir todo junto",
        created_at: "2026-08-24T12:00:00.000Z",
        restaurant_tables: { name: "Mesa 4" },
        dining_order_items: [
          {
            id: "item-1",
            product_name: "Hamburguesa",
            quantity: 2,
            note: "Sin cebolla",
          },
        ],
      },
    ]);

    expect(order).toMatchObject({
      number: "123456",
      tableName: "Mesa 4",
      customerNote: "Servir todo junto",
      items: [{ name: "Hamburguesa", quantity: 2, note: "Sin cebolla" }],
    });
  });
});
