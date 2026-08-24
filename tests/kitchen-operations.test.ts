import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const board = readFileSync(
  "src/components/dashboard/kitchen-board.tsx",
  "utf8",
);
const loader = readFileSync("src/lib/kitchen-orders-server.ts", "utf8");

describe("kitchen operations", () => {
  it("asks the device to stay awake after a staff gesture", () => {
    expect(board).toContain("wakeLock");
    expect(board).toContain('request("screen")');
  });
  it("restores the lock when the kitchen returns to the foreground", () =>
    expect(board).toContain("visibilitychange"));
  it("resumes audio before sounding a new order", () =>
    expect(board).toContain("context.resume()"));
  it("allows staff to cancel an accepted or preparing order", () => {
    expect(board).toContain('move(order.id, "cancelled")');
    expect(board).toContain("¿Cancelar esta comanda?");
  });
  it("refreshes orders automatically even when realtime is unavailable", () => {
    expect(board).toContain('fetch("/api/dashboard/kitchen/orders"');
    expect(board).toContain(
      "window.setInterval(() => void refreshOrders(), 1000)",
    );
    expect(board).toContain("setOrders(payload.orders)");
    expect(board).toContain('table: "dining_orders"');
    expect(board).toContain('table: "dining_order_items"');
    expect(board).toContain(
      "window.setTimeout(() => void refreshOrders(), 40)",
    );
  });
  it("highlights all information sent from the table", () => {
    expect(board).toContain("Observación general de la mesa");
    expect(board).toContain("Modificación solicitada:");
    expect(board).toContain("order.customerNote");
    expect(board).toContain("item.note");
  });
  it("uses an app-like mobile layout and never leaves an endless detail loader", () => {
    expect(board).toContain("Estados de cocina");
    expect(board).toContain("Servicio en curso");
    expect(board).toContain("setOrders((current)");
    expect(board).not.toContain("Cargando el detalle del pedido");
  });
  it("loads complete order details on the server after restaurant authorization", () => {
    expect(loader).toContain("getSupabaseSecretKey");
    expect(loader).toContain("kitchenOrderSelect");
    expect(loader).toContain('.eq("restaurant_id", restaurantId)');
  });
});
