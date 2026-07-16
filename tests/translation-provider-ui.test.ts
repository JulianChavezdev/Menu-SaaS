import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("estado de DeepL en superadmin",()=>{
  const page=readFileSync("src/app/superadmin/page.tsx","utf8");
  const component=readFileSync("src/components/superadmin/translation-provider-status.tsx","utf8");
  it("muestra disponibilidad y consumo sin leer ni renderizar secretos",()=>{expect(page).toContain("translationProviderStatus()");expect(page).toContain("<TranslationProviderStatus");expect(component).toContain("caracteres utilizados");expect(component).not.toContain("process.env");expect(component).not.toContain("Authorization")});
});
