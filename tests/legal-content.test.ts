import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";

const root=process.cwd();
const read=(path:string)=>readFileSync(join(root,path),"utf8");

describe("legal publication safeguards",()=>{
  it("requires the mandatory identity fields",()=>{
    const source=read("src/lib/legal.ts");
    expect(source).toContain("identity.name && identity.taxId && identity.address && identity.email");
  });

  it.each(["legal","privacidad","cookies","condiciones","encargo-datos"])("protects /%s until identity is complete",route=>{
    const source=read(`src/app/${route}/page.tsx`);
    expect(source).toMatch(/if\s*\(!identity\.complete\)\s*notFound\(\)/);
  });

  it("distinguishes local carts, kitchen orders and fiscal POS functions",()=>{
    const terms=read("src/app/condiciones/page.tsx");
    const privacy=read("src/app/privacidad/page.tsx");
    expect(terms).toContain("Menuly Pedidos");
    expect(terms).toContain("no sustituye un TPV fiscal");
    expect(privacy).toContain("Solo cuando el");
    expect(privacy).toContain("confirma el");
  });

  it("makes the restaurant responsible for allergen review",()=>{
    const terms=read("src/app/condiciones/page.tsx");
    expect(terms.replace(/\s+/g," ")).toContain("La información de alérgenos la proporciona y valida exclusivamente el restaurante");
  });
});
