import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const upload=readFileSync("src/components/dashboard/media-upload.tsx","utf8");
const actions=readFileSync("src/app/dashboard/actions.ts","utf8");
const page=readFileSync("src/app/dashboard/menu/page.tsx","utf8");

describe("product photos",()=>{
  it("offers a product photo selector and stores its public URL",()=>{expect(upload).toContain('kind==="product-image"');expect(upload).toContain("Producto para la foto");expect(upload).toContain("/image-");expect(actions).toContain('image_path:path,image_url:url')});
  it("explains automatic thumbnails and custom photo replacement",()=>{expect(page).toContain('kind="product-image"');expect(page).toContain("se genera una miniatura");expect(page).toContain("sustituirla cuando quieras")});
});
