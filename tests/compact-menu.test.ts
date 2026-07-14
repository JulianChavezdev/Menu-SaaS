import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const menu=readFileSync("src/components/menu/video-menu.tsx","utf8");
const preview=readFileSync("src/components/dashboard/appearance-preferences.tsx","utf8");

describe("ficha compacta de producto",()=>{
  it("limita la altura y el texto en la carta pública",()=>{
    expect(menu).toContain("data-product-details");
    expect(menu).toContain("max-h-[34dvh]");
    expect(menu).toContain("line-clamp-2");
    expect(menu).not.toContain("text-[clamp(2rem,9vw,3rem)]");
  });

  it("mantiene compacta la vista previa de las plantillas",()=>{
    expect(preview).toContain('large?"text-2xl":"text-sm"');
    expect(preview).toContain("line-clamp-2");
  });
});
