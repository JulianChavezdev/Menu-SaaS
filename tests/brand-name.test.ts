import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const files=[
  "src/app/layout.tsx",
  "src/app/manifest.ts",
  "src/app/page.tsx",
  "src/components/marketing/marketing-nav.tsx",
  "src/app/dashboard/layout.tsx",
  "src/app/(auth)/login/page.tsx",
  "src/app/(auth)/register/page.tsx",
];

describe("Menuly brand",()=>{
  it("uses the exact brand spelling in every primary surface",()=>{
    for(const file of files){
      const source=readFileSync(file,"utf8");
      expect(source,file).toContain("Menuly");
      expect(source,file).not.toContain("Carta Video");
      expect(source,file).not.toContain("MenuLy");
    }
  });

  it("uses the custom domain and branded manual",()=>{
    expect(readFileSync("package.json","utf8")).toContain("https://menuly.es");
    expect(readFileSync("src/app/page.tsx","utf8")).toContain("/manual-menuly-restaurantes.pdf");
  });
});
