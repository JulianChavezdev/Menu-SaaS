import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const menu=readFileSync("src/components/menu/video-menu.tsx","utf8");
const media=readFileSync("src/components/menu/product-media.tsx","utf8");

describe("virtualización del feed de vídeo",()=>{
  it("hidrata exclusivamente el producto actual y sus vecinos",()=>{expect(menu).toContain("hydrated={Math.abs(index-active)<=1}");expect(media).toContain("src&&hydrated&&<video");expect(menu).toContain("root:feedRef.current");expect(menu).toContain("threshold:[.35]")});
  it("usa portadas estáticas en el catálogo y ofrece acceso directo por categoría",()=>{expect(menu).not.toContain('src={`${product.video_url}#t=0.1`}');expect(menu).toContain('aria-label={text.categories}');expect(menu).toContain('go(`product-${group.products[0].id}`,true)');expect(menu).toContain('behavior:"instant"')});
  it("publica una señal estable cuando los controles ya están hidratados",()=>expect(menu).toContain('data-hydrated={hydrated?"true":"false"}'));
  it("centra tres categorías arriba y atenúa las laterales",()=>{expect(menu).toContain("categoryNavRef");expect(menu).toContain("button.offsetLeft-(nav.clientWidth-button.offsetWidth)/2");expect(menu).toContain("w-[calc((100%-1rem)/3)]");expect(menu).toContain('selected?"opacity-100":"opacity-[.45]"');expect(menu).toContain("top-[calc(max(1rem,env(safe-area-inset-top))+3.25rem)]")});
  it("precarga ambos vídeos vecinos y reintenta tras gestos, conexión o regreso a la app",()=>{expect(menu).toContain('preload={Math.abs(index-active)<=1?"auto":"metadata"}');expect(media).toContain('video.preload="auto"');expect(media).toContain("HTMLMediaElement.NETWORK_EMPTY");expect(menu).toContain("onTouchEnd={resumeActiveVideo}");expect(menu).toContain('addEventListener("pageshow",resume)');expect(menu).toContain('addEventListener("online",resume)')});
  it("reserva una zona segura para desplegar descripción y alérgenos",()=>{expect(menu).toContain("100dvh-11rem-env(safe-area-inset-top)-env(safe-area-inset-bottom)");expect(menu).toContain("revealExpandedDetails");expect(menu).toContain("overscroll-contain")});
});
