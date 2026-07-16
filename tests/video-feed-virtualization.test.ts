import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const menu=readFileSync("src/components/menu/video-menu.tsx","utf8");
const media=readFileSync("src/components/menu/product-media.tsx","utf8");

describe("virtualización del feed de vídeo",()=>{
  it("hidrata exclusivamente el producto actual y sus vecinos",()=>{expect(menu).toContain("hydrated={Math.abs(index-active)<=1}");expect(media).toContain("src&&hydrated&&<video");expect(menu).toContain("root:feedRef.current");expect(menu).toContain("threshold:[.6]")});
  it("usa portadas estáticas en el catálogo y ofrece acceso directo por categoría",()=>{expect(menu).not.toContain('src={`${product.video_url}#t=0.1`}');expect(menu).toContain('aria-label={text.categories}');expect(menu).toContain('go(`product-${group.products[0].id}`)')});
  it("publica una señal estable cuando los controles ya están hidratados",()=>expect(menu).toContain('data-hydrated={hydrated?"true":"false"}'));
});
