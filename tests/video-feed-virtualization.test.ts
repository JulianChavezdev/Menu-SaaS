import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const menu=readFileSync("src/components/menu/video-menu.tsx","utf8");
const media=readFileSync("src/components/menu/product-media.tsx","utf8");

describe("virtualización del feed de vídeo",()=>{
  it("hidrata exclusivamente el producto actual y sus vecinos",()=>{expect(menu).toContain("hydrated={Math.abs(index-active)<=1}");expect(media).toContain("src&&hydrated&&<video");expect(menu).toContain("root:feedRef.current");expect(menu).toContain("threshold:[.6]")});
  it("usa portadas estáticas en el catálogo y ofrece acceso directo por categoría",()=>{expect(menu).not.toContain('src={`${product.video_url}#t=0.1`}');expect(menu).toContain('aria-label={text.categories}');expect(menu).toContain('go(`product-${group.products[0].id}`,true)');expect(menu).toContain('behavior:"instant"')});
  it("publica una señal estable cuando los controles ya están hidratados",()=>expect(menu).toContain('data-hydrated={hydrated?"true":"false"}'));
  it("centra tres categorías arriba y atenúa las laterales",()=>{expect(menu).toContain("categoryNavRef");expect(menu).toContain("button.offsetLeft-(nav.clientWidth-button.offsetWidth)/2");expect(menu).toContain("w-[calc((100%-1rem)/3)]");expect(menu).toContain('selected?"opacity-100":"opacity-[.45]"');expect(menu).toContain("top-[calc(max(1rem,env(safe-area-inset-top))+3.5rem)]")});
  it("precarga el siguiente vídeo y reintenta tras gestos o al volver a la app",()=>{expect(menu).toContain('preload={index>=active&&index<=active+1?"auto":"metadata"}');expect(menu).toContain("onTouchEnd={resumeActiveVideo}");expect(menu).toContain('addEventListener("pageshow",resume)')});
});
