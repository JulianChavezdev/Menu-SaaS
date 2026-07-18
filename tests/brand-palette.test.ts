import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const tailwind=readFileSync("tailwind.config.ts","utf8");
const globalCss=readFileSync("src/app/globals.css","utf8");
const layout=readFileSync("src/app/layout.tsx","utf8");
const manifest=readFileSync("src/app/manifest.ts","utf8");

describe("brand palette",()=>{
  it("uses bottle green and warm cream across the SaaS shell",()=>{
    for(const source of[tailwind,globalCss,layout,manifest])expect(source).toContain("#064E3B");
    for(const source of[tailwind,globalCss,manifest])expect(source).toContain("#F8E7C9");
  });

  it("maps the existing orange design tokens onto the new brand",()=>{
    expect(tailwind).toContain('100:"#F8E7C9"');
    expect(tailwind).toContain('600:"#064E3B"');
  });
});
