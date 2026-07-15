import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const page=readFileSync("src/app/page.tsx","utf8");
const nav=readFileSync("src/components/marketing/marketing-nav.tsx","utf8");

describe("landing pública",()=>{
  it("incluye todas las secciones comerciales",()=>{for(const id of["inicio","producto","como-funciona","precios","faq","contacto"])expect(page).toContain(`id="${id}"`);expect(page).not.toContain('id="nosotros"')});
  it("ofrece navegación mobile y llamadas a demo, registro y acceso",()=>{expect(nav).toContain('aria-label="Navegación principal"');expect(nav).toContain('aria-expanded={open}');expect(page).toContain('href="/r/bistro-nube"');expect(page).toContain('href="/register"');expect(nav).toContain('href="/login"')});
  it("no publica un correo personal y usa una variable explícita",()=>{expect(page).toContain("NEXT_PUBLIC_CONTACT_EMAIL");expect(page).not.toMatch(/[\w.+-]+@hotmail\.com/i)});
  it("incluye metadatos específicos y un enlace de salto",()=>{expect(page).toContain("export const metadata");expect(page).toContain('href="#contenido"')});
});
