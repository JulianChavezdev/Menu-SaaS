import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");
const dashboard = readFileSync("src/app/dashboard/layout.tsx", "utf8");
const auth = readFileSync("src/app/(auth)/layout.tsx", "utf8");
const operations = readFileSync("src/app/operaciones/layout.tsx", "utf8");
const superadmin = readFileSync("src/app/superadmin/layout.tsx", "utf8");

describe("sistema visual Menuly", () => {
  it("comparte la identidad de la landing en las áreas privadas", () => {
    for (const layout of [dashboard, auth, superadmin]) {
      expect(layout).toContain("menuly-app");
    }
    expect(operations).toContain("dashboard-light");
    expect(operations).not.toContain("menuly-app");
    for (const token of ["#0b0b0c", "#1a1a1a", "#f5f0eb", "#d4943a", "--font-marketing-sans"]) {
      expect(css).toContain(token);
    }
  });

  it("mantiene el alcance fuera de las plantillas públicas", () => {
    const publicMenu = readFileSync("src/components/menu/video-menu.tsx", "utf8");
    expect(publicMenu).not.toContain("menuly-app");
  });
});
