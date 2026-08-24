import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const component = readFileSync(
  "src/components/dashboard/waiter-pos.tsx",
  "utf8",
);
const action = readFileSync(
  "src/app/dashboard/ordering/pos-actions.ts",
  "utf8",
);
const tables = readFileSync("src/app/dashboard/tables/page.tsx", "utf8");
const publicMenu = readFileSync("src/app/r/[slug]/page.tsx", "utf8");

describe("mobile waiter POS", () => {
  it("uses the restaurant tables, categories, products and images", () => {
    for (const marker of [
      "Selecciona una mesa",
      "Categorías",
      "product.image_url",
      "Buscar producto o bebida",
      "Comanda actual",
    ])
      expect(component).toContain(marker);
  });

  it("uses a native mobile flow with table and visual category selection", () => {
    expect(component).toContain("Mesa de la comanda");
    expect(component).toContain("categoryCovers");
    expect(component).toContain("Volver a categorías");
    expect(component).toContain("min-h-[100dvh]");
  });

  it("sends quantities and notes directly to kitchen", () => {
    expect(component).toContain("createStaffDiningOrder(payload)");
    expect(component).toContain("Enviar a Cocina");
    expect(component).toContain("generalNote");
    expect(component).toContain("note: event.target.value");
  });

  it("creates or reuses the technical session without waiter interaction", () => {
    expect(action).toContain('.from("table_sessions")');
    expect(action).toContain("12 * 60 * 60 * 1000");
    expect(action).toContain('"create_public_dining_order"');
    expect(action).toContain("requestId");
    expect(tables).toContain("No es necesario");
    expect(tables).not.toContain("openTableSession");
    expect(tables).not.toContain("closeTableSession");
  });

  it("does not expose staff sessions as public table ordering", () => {
    expect(publicMenu).not.toContain("tableOrdering=");
    expect(publicMenu).not.toContain('from("table_sessions")');
  });
});
