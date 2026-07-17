import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const menu=readFileSync("src/components/menu/video-menu.tsx","utf8");
const preview=readFileSync("src/components/dashboard/appearance-preferences.tsx","utf8");

describe("ficha compacta de producto",()=>{
  it("limita la altura y el texto en la carta pública",()=>{
    expect(menu).toContain("data-product-details");
    expect(menu).toContain("max-h-[calc(100dvh-11rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))]");
    expect(menu).toContain("revealExpandedDetails");
    expect(menu).toContain("h-screen h-dvh");
    expect(menu).toContain('hydrated={Math.abs(index-active)<=1}');
    expect(menu).toContain('preload={Math.abs(index-active)<=1?"auto":"metadata"}');
    expect(menu).toContain('aria-label={text.categories}');
    expect(menu).toContain("top-[calc(max(1rem,env(safe-area-inset-top))+3.25rem)]");
    expect(menu).toContain("pb-[calc(5.5rem+max(.75rem,env(safe-area-inset-bottom)))]");
    expect(menu).not.toContain("bottom-[calc(max(.75rem,env(safe-area-inset-bottom))+4.75rem)]");
    expect(menu).toContain("line-clamp-1");
    expect(menu).not.toContain("text-[clamp(2rem,9vw,3rem)]");
    expect(menu).toContain("<details");
    expect(menu).toContain('setPanel("cart")');
    expect(menu).toContain('title={text.menu}');
    expect(menu).not.toContain('<List size={18}/>{text.menu}');
    expect(menu).toContain("addFromCatalog");
    expect(menu).toContain("catalogAdded");
    expect(menu).toContain("<Check");
    expect(menu).not.toContain("card?");
    expect(menu).toContain("introVisible");
    expect(menu).toContain("data-menu-intro");
    expect(menu).toContain("Abrir carta");
    expect(menu).toContain("Abriendo la carta de");
    expect(menu).not.toContain("animate-pulse");
    expect(menu).toContain("lg:pl-[440px]");
    expect(menu).toContain("lg:left-[calc(50%-430px)]");
    expect(menu).toContain("lg:grid-cols-4");
    expect(menu).toContain("lg:grid-cols-1");
  });

  it("mantiene compacta la vista previa de las plantillas",()=>{
    expect(preview).toContain('large?"text-2xl":"text-sm"');
    expect(preview).toContain("line-clamp-2");
  });
});
