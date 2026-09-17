import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const demo = readFileSync("src/app/demo/page.tsx", "utf8");

describe("ruta de demo de la landing", () => {
  it("sirve la carta directamente en móviles y la experiencia guiada en pantallas grandes", () => {
    expect(demo).toContain("<LandingDemoExperience");
    expect(demo).toContain("<VideoMenu");
    expect(demo).toContain('from "next/headers"');
    expect(demo).toContain("Android.*Mobile");
    expect(demo).toContain("analyticsEnabled={false}");
    expect(demo).toContain("introEnabled={false}");
    expect(demo).toContain('slug="bistro-nube"');
    expect(demo).toContain('initialTemplate="noirluxe"');
    expect(demo).not.toContain("activeRestaurant");
    expect(demo).not.toContain("supabase");
  });
});
