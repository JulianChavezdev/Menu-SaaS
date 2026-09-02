import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("src/app/page.tsx", "utf8");
const nav = readFileSync("src/components/marketing/marketing-nav.tsx", "utf8");
const publicMenu = readFileSync("src/app/r/[slug]/page.tsx", "utf8");
const landingDemo = readFileSync(
  "src/components/menu/landing-demo-experience.tsx",
  "utf8",
);

describe("landing pública", () => {
  it("incluye todas las secciones comerciales", () => {
    for (const id of [
      "inicio",
      "producto",
      "como-funciona",
      "precios",
      "faq",
      "contacto",
    ])
      expect(page).toContain(`id="${id}"`);
    expect(page).not.toContain('id="nosotros"');
  });
  it("ofrece navegación mobile y llamadas a demo, registro y acceso", () => {
    expect(nav).toContain('aria-label="Navegación principal"');
    expect(nav).toContain("aria-expanded={open}");
    expect(page).toContain('href="/demo"');
    expect(page).toContain('href="/register"');
    expect(nav).toContain('href="/login"');
  });
  it("abre el alta con el plan comercial correspondiente", () => {
    for (const plan of ["carta", "pedidos", "configuracion"])
      expect(page).toContain(`/register?plan=${plan}`);
  });
  it("no publica un correo personal y usa una variable explícita", () => {
    expect(page).toContain("NEXT_PUBLIC_CONTACT_EMAIL");
    expect(page).not.toMatch(/[\w.+-]+@hotmail\.com/i);
  });
  it("incluye metadatos específicos y un enlace de salto", () => {
    expect(page).toContain("export const metadata");
    expect(page).toContain('href="#contenido"');
  });
  it("publica los planes sin ofrecer una prueba gratuita", () => {
    for (const copy of [
      "Plan Carta",
      "34,99 €",
      "344,30 €/año",
      "ahorra un 18%",
      "Configuración completa",
      "149,99 €",
      "Segundo mes de Plan Carta gratis",
      "Edición de vídeos con IA",
      "Primer mes de Plan Carta incluido",
    ])
      expect(page).toContain(copy);
    expect(page).toContain('"6 plantillas"');
    expect(page).not.toContain("30 días gratis");
    expect(page).toContain("seis estilos visuales");
    expect(page).toContain("No ofrecemos una prueba gratuita general");
    expect(page).toContain("Menuly Comandas sí conecta el comandero móvil");
  });
  it("ofrece soporte prioritario sin prometer disponibilidad 24/7", () => {
    expect(page).toContain("Soporte prioritario todos los días");
    expect(page).toContain("incidencias críticas");
    expect(page).not.toContain("24/7");
    expect(page).toContain("https://wa.me/34643663194");
    expect(page).toContain("+34 643 663 194");
  });
  it("enlaza el manual para restaurantes", () => {
    expect(page).toContain("/manual-menuly-restaurantes.pdf");
    expect(page).toContain("Manual");
  });
  it("replica el mockup editorial de Figma con recursos locales", () => {
    expect(page).toContain("function HeroCards");
    expect(page).toContain("/landing/figma/asset-3.png");
    expect(page).toContain("/landing/figma/dish-1.jpg");
    expect(page).toContain("/landing/figma/asset-7.png");
    expect(page).not.toContain("figma.com/api/mcp/asset");
  });
  it("desactiva las analíticas y la apertura de marca dentro de la vista previa", () => {
    expect(publicMenu.replace(/\s+/g, " ")).toContain(
      'landingPreview = query.preview === "landing"',
    );
    expect(publicMenu).toContain("analyticsEnabled={!preview}");
    expect(publicMenu).toContain("introEnabled={!preview}");
  });
  it("presenta la demo guiada en pantallas grandes y mantiene la carta completa en móvil", () => {
    expect(publicMenu).toContain("<LandingDemoExperience");
    expect(landingDemo).toContain("md:grid-cols-");
    expect(landingDemo).toContain('src={`/r/${slug}?preview=embed&template=${selectedTemplate}`}');
    expect(landingDemo).toContain("Object.values(MENU_TEMPLATES)");
    expect(landingDemo).toContain("setSelectedTemplate(template.key)");
    expect(publicMenu).toContain("previewTemplate");
    expect(landingDemo).toContain('className="h-full w-full border-0"');
    expect(landingDemo).toContain('className="hidden min-w-0 md:block"');
    expect(landingDemo).toContain("Desliza para descubrir");
    expect(landingDemo).toContain("Prepara tu selección");
  });
  it("sirve un primer vídeo ligero de Cloudinary en el mockup", () => {
    expect(publicMenu).toContain("LANDING_PREVIEW_VIDEO");
    expect(publicMenu).toContain("c_limit,w_480");
    expect(publicMenu).toContain("q_auto:eco");
  });
});
