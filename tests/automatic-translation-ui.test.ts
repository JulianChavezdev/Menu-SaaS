import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const actions=readFileSync("src/app/dashboard/actions.ts","utf8");
const products=readFileSync("src/components/dashboard/products-manager.tsx","utf8");
const categories=readFileSync("src/components/dashboard/categories-manager.tsx","utf8");
const restaurant=readFileSync("src/components/dashboard/restaurant-details-form.tsx","utf8");
const appearance=readFileSync("src/components/dashboard/appearance-preferences.tsx","utf8");
const superadmin=readFileSync("src/app/superadmin/actions.ts","utf8");

describe("flujo de traducción automática",()=>{
  it("traduce al guardar todos los tipos de contenido",()=>{expect(actions.match(/translateFieldsToEnglish/g)?.length).toBeGreaterThanOrEqual(4);expect(actions).toContain("translateEntireMenu");expect(actions).toContain('mergeTranslation(item.translations,"en"')});
  it("retira todos los campos manuales ingleses",()=>{for(const source of[products,categories,restaurant]){expect(source).not.toContain('name="name_en"');expect(source).not.toContain('name="description_en"');expect(source).not.toContain("Traducción al inglés (opcional)")}});
  it("permite retraducir el contenido existente",()=>{expect(appearance).toContain("Traducir ahora toda la carta");expect(appearance).toContain("translateEntireMenu")});
  it("también traduce las ediciones de soporte",()=>{expect(superadmin).toContain("translateFieldsToEnglish");expect(superadmin.match(/automaticTranslationMap/g)?.length).toBeGreaterThanOrEqual(4)});
});
