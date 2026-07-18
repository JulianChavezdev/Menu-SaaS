import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const upload = readFileSync(
  "src/components/dashboard/media-upload.tsx",
  "utf8",
);
const actions = readFileSync("src/app/dashboard/actions.ts", "utf8");
const page = readFileSync("src/app/dashboard/menu/page.tsx", "utf8");

describe("product photos", () => {
  it("offers a product photo selector and stores its public URL", () => {
    expect(upload).toMatch(/kind\s*===\s*"product-image"/);
    expect(upload).toContain("Producto para la foto");
    expect(upload).toContain("/image-");
    expect(actions).toMatch(/image_path:\s*path,\s*image_url:\s*url/);
  });
  it("explains automatic thumbnails and custom photo replacement", () => {
    expect(page).toContain('kind="product-image"');
    expect(page).toContain("se genera una miniatura");
    expect(page).toContain("sustituirla cuando quieras");
  });
  it("extracts a frame automatically for fallback video uploads", () => {
    expect(upload).toContain("createVideoPoster(file)");
    expect(upload).toContain("image-auto-");
    expect(actions).toContain("posterPath");
    expect(actions).toContain("isAutomaticPosterPath");
  });
});
