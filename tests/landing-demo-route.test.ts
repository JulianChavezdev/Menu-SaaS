import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const demo = readFileSync("src/app/demo/page.tsx", "utf8");

describe("ruta de demo de la landing", () => {
  it("renderiza directamente la experiencia guiada sin consultar el restaurante", () => {
    expect(demo).toContain("<LandingDemoExperience");
    expect(demo).toContain('slug="bistro-nube"');
    expect(demo).toContain('initialTemplate="noirluxe"');
    expect(demo).not.toContain("activeRestaurant");
    expect(demo).not.toContain("supabase");
  });
});
