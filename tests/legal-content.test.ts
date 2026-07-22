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

  it("does not describe the cart as an order",()=>{
    const terms=read("src/app/condiciones/page.tsx");
    expect(terms).toContain("no transmite comandas");
    expect(terms).toContain("no sustituye un TPV");
  });

  it("makes the restaurant responsible for allergen review",()=>{
    const terms=read("src/app/condiciones/page.tsx");
    expect(terms.replace(/\s+/g," ")).toContain("La información de alérgenos la proporciona y valida exclusivamente el restaurante");
  });
});
