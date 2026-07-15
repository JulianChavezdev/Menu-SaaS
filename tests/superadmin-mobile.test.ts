import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const layout=readFileSync("src/app/superadmin/layout.tsx","utf8");

describe("cabecera mobile-first del superadmin",()=>{
  it("apila la marca y distribuye la navegación sin desbordamiento",()=>{
    expect(layout).toContain("overflow-x-hidden");
    expect(layout).toContain("flex-col gap-2");
    expect(layout).toContain("sm:flex-row");
    expect(layout).toContain("grid grid-cols-2");
    expect(layout).toContain('/superadmin/activity');
  });
});
