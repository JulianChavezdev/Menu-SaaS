import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const tailwind=readFileSync("tailwind.config.ts","utf8");
const globalCss=readFileSync("src/app/globals.css","utf8");
const layout=readFileSync("src/app/layout.tsx","utf8");
const manifest=readFileSync("src/app/manifest.ts","utf8");

describe("brand palette",()=>{
  it("uses vivid purple and warm peach across the SaaS shell",()=>{
    for(const source of[tailwind,globalCss,layout,manifest])expect(source).toContain("#6A00F4");
    for(const source of[tailwind,globalCss,manifest])expect(source).toContain("#FFD6A5");
  });

  it("maps the existing orange design tokens onto the new brand",()=>{
    expect(tailwind).toContain('100:"#FFD6A5"');
    expect(tailwind).toContain('600:"#6A00F4"');
  });
});
