import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const menu = readFileSync("src/components/menu/video-menu.tsx", "utf8");
const media = readFileSync("src/components/menu/product-media.tsx", "utf8");
const vectors = readFileSync("src/components/menu/theme-vectors.tsx", "utf8");
const noirTokens = readFileSync("src/lib/noirluxe-design-tokens.ts", "utf8");
const mareTheme = readFileSync("src/components/menu/mare-nostrum.tsx", "utf8");

describe("virtualización del feed de vídeo", () => {
  it("hidrata exclusivamente el producto actual y sus vecinos", () => {
    expect(menu).toContain("hydrated={Math.abs(index - active) <= 1}");
    expect(media).toContain("src&&hydrated&&<video");
    expect(menu).toContain("root: feedRef.current");
    expect(menu).toContain("threshold: [0.35]");
  });
  it("usa portadas estáticas en el catálogo y ofrece acceso directo por categoría", () => {
    expect(menu).not.toContain("src={`${product.video_url}#t=0.1`}");
    expect(menu).toContain("aria-label={text.categories}");
    expect(menu).toContain("onClick={() => openCategory(group.id)}");
    expect(menu).toContain('behavior: "instant"');
  });
  it("publica una señal estable y renderiza los primeros vídeos desde el HTML", () => {
    expect(menu).toContain('data-hydrated={hydrated ? "true" : "false"}');
    expect(menu).toContain("const hydrated = true");
    expect(menu).not.toContain("setHydrated");
  });
  it("centra tres categorías arriba y atenúa las laterales", () => {
    expect(menu).toContain("categoryNavRef");
    expect(menu).toContain(
      "button.offsetLeft - (nav.clientWidth - button.offsetWidth) / 2",
    );
    expect(menu).toContain("w-[calc((100%-1rem)/3)]");
    expect(menu).toContain('selected ? "opacity-100" : "opacity-[.45]"');
    expect(menu).toContain(
      "top-[calc(max(1rem,env(safe-area-inset-top))+3.25rem)]",
    );
  });
  it("precarga ambos vídeos vecinos y reintenta tras gestos, conexión o regreso a la app", () => {
    expect(menu).toContain(
      'preload={Math.abs(index - active) <= 1 ? "auto" : "metadata"}',
    );
    expect(media).toContain('video.preload="auto"');
    expect(media).toContain("HTMLMediaElement.NETWORK_EMPTY");
    expect(menu).toContain("onTouchEnd={handleTouchEnd}");
    expect(menu).toContain('addEventListener("pageshow", resume)');
    expect(menu).toContain('addEventListener("online", resume)');
  });
  it("reproduce el primer vídeo detrás de la apertura de marca para mostrarlo ya cargado", () => {
    expect(menu).toContain("active={index === active}");
    expect(menu).not.toContain(
      "if(introVisible){video.pause();video.currentTime=0;return}",
    );
    expect(menu).toContain("if (introVisible) return");
  });
  it("reserva una zona segura para desplegar descripción y alérgenos", () => {
    expect(menu).toContain(
      "100dvh-11rem-env(safe-area-inset-top)-env(safe-area-inset-bottom)",
    );
    expect(menu).toContain("revealExpandedDetails");
    expect(menu).toContain("overscroll-contain");
  });
  it("deja la plantilla principal NoirLuxe sin vectores decorativos", () => {
    expect(menu).toContain('template.key === "noirluxe"');
    expect(vectors).toContain('motif === "noirluxe"');
  });
  it("integra Street y Cozy Corner con sus controles y tipografías de Figma", () => {
    expect(menu).toContain('template.key === "street"');
    expect(menu).toContain('template.key === "cozy-corner"');
    expect(menu).toContain("FigmaThemeHamburger");
    expect(menu).toContain("FigmaThemeBasket");
    expect(menu).toContain("FigmaThemeAdd");
    expect(menu).toContain("font-[var(--font-street-condensed)]");
    expect(menu).toContain("font-[var(--font-cozy-display)]");
    expect(vectors).toContain('motif === "street"');
    expect(vectors).toContain('motif === "cozy-corner"');
  });
  it("mueve los controles de NoirLuxe al menú superior y conserva el carrito separado", () => {
    expect(menu).toContain('onClick={() => setPanel("controls")}');
    expect(menu).toContain('panel === "controls"');
    expect(menu).toContain('onClick={() => setPanel("menu")}');
    expect(menu).toContain('onClick={() => setPanel("cart")}');
    expect(menu).toContain("fontFamily: noirLuxe");
    expect(menu).toContain('? "var(--font-noir-sans)"');
    expect(menu).toContain("NOIRLUXE_TOKENS.typography.dishName");
    expect(noirTokens).toContain("dishName:");
    expect(noirTokens).toContain("text-[32px]");
    expect(noirTokens).toContain("leading-[38px]");
    expect(noirTokens).toContain("price:");
    expect(noirTokens).toContain("text-[28px]");
    expect(noirTokens).toContain("category:");
    expect(noirTokens).toContain("tracking-[.16em]");
  });
  it("mantiene productos por categoría y cambia de categoría con gestos laterales o al terminar", () => {
    expect(menu).toContain("const visibleProducts =");
    expect(menu).toContain("visibleProducts.map((product)");
    expect(menu).toContain("Math.abs(dx) > 50");
    expect(menu).toContain("dy < -55 && atBottom");
    expect(menu).toContain("changeCategory(1)");
  });
  it("anima horizontalmente el vídeo completo al cambiar de categoría", () => {
    expect(menu).toContain(
      'setCategorySlide(direction === 1 ? "exit-left" : "exit-right")',
    );
    expect(menu).toContain(
      'setCategorySlide(direction === 1 ? "enter-right" : "enter-left")',
    );
    expect(menu).toContain("data-category-slide={categorySlide}");
    expect(menu).toContain(
      "transition-[transform,opacity] duration-[240ms] ease-out",
    );
    expect(menu).toContain('matchMedia("(prefers-reduced-motion: reduce)")');
  });
  it("abre los controles de NoirLuxe como sidebar vertical y no los duplica en Carta", () => {
    expect(menu).toContain("items-stretch justify-start");
    expect(menu).toContain("w-[104px]");
    expect(menu).toContain("mt-5 flex w-full flex-col items-center gap-2");
    expect(menu).toContain("grid size-12 place-items-center");
    expect(menu).not.toContain("mb-4 grid grid-cols-5");
  });
  it("mantiene visibles los controles de Cozy Corner sobre su panel rojo", () => {
    expect(menu).toContain(
      'const sidebarAccent = cozyCorner ? "#FFD600" : colors.accent',
    );
    expect(menu).toContain(
      'const sidebarPanel = cozyCorner ? "#C92F27" : colors.panel',
    );
    expect(menu).toContain("background: sidebarAccent");
  });
  it("integra Mare Nostrum con navegación, assets y oleaje propios", () => {
    expect(menu).toContain('template.key === "mare-nostrum"');
    expect(menu).toContain("MareNostrumHamburger");
    expect(menu).toContain("MareNostrumBasket");
    expect(menu).toContain("MareNostrumAdd");
    expect(menu).toContain("MareNostrumWave");
    expect(menu).toContain("azulejo-corner.svg");
    expect(menu).toContain("school-of-fish.svg");
    expect(mareTheme).toContain('transform: "translateX(-50%)"');
    expect(vectors).toContain('motif === "mare-nostrum"');
  });
});
