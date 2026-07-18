import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const page=readFileSync("src/app/page.tsx","utf8");
const nav=readFileSync("src/components/marketing/marketing-nav.tsx","utf8");
const publicMenu=readFileSync("src/app/r/[slug]/page.tsx","utf8");

describe("landing pública",()=>{
  it("incluye todas las secciones comerciales",()=>{for(const id of["inicio","producto","como-funciona","precios","faq","contacto"])expect(page).toContain(`id="${id}"`);expect(page).not.toContain('id="nosotros"')});
  it("ofrece navegación mobile y llamadas a demo, registro y acceso",()=>{expect(nav).toContain('aria-label="Navegación principal"');expect(nav).toContain('aria-expanded={open}');expect(page).toContain('href="/r/bistro-nube"');expect(page).toContain('href="/register"');expect(nav).toContain('href="/login"')});
  it("no publica un correo personal y usa una variable explícita",()=>{expect(page).toContain("NEXT_PUBLIC_CONTACT_EMAIL");expect(page).not.toMatch(/[\w.+-]+@hotmail\.com/i)});
  it("incluye metadatos específicos y un enlace de salto",()=>{expect(page).toContain("export const metadata");expect(page).toContain('href="#contenido"')});
  it("publica los tres planes y el ahorro anual",()=>{for(const copy of["Prueba","Plan Carta","34,99 €","344,30 €/año","ahorra un 18%","Llave en mano","149,99 €","Primer mes gratis","Hasta 4 vídeos por categoría","Máximo 5 categorías"])expect(page).toContain(copy)});
  it("ofrece soporte continuo y contacto por WhatsApp",()=>{expect(page).toContain("soporte 24/7");expect(page).toContain("todos los días de la semana");expect(page).toContain("https://wa.me/34643663194");expect(page).toContain("+34 643 663 194")});
  it("enlaza el manual para restaurantes",()=>{expect(page).toContain('/manual-menuly-restaurantes.pdf');expect(page).toContain('>Manual</a>')});
  it("muestra la carta móvil real dentro del mockup sin contaminar analíticas",()=>{expect(page).toContain("aspect-[9/18.7]");expect(page).toContain('title="Vista móvil real de Menuly"');expect(page).toContain('src="/r/bistro-nube?preview=landing"');expect(page).toContain('allow="autoplay"');expect(page).toContain("Así verán tus clientes cada plato");expect(page).not.toContain("MockControl")});
  it("desactiva las analíticas y la apertura de marca dentro de la vista previa",()=>{expect(publicMenu).toContain('preview==="landing"');expect(publicMenu).toContain("analyticsEnabled={!preview}");expect(publicMenu).toContain("introEnabled={!preview}")});
  it("sirve un primer vídeo ligero de Cloudinary en el mockup",()=>{expect(publicMenu).toContain("LANDING_PREVIEW_VIDEO");expect(publicMenu).toContain("c_limit,w_480");expect(publicMenu).toContain("q_auto:eco")});
});
