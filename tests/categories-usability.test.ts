import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const page=readFileSync("src/app/dashboard/menu/page.tsx","utf8");
const manager=readFileSync("src/components/dashboard/categories-manager.tsx","utf8");
const publicMenu=readFileSync("src/components/menu/video-menu.tsx","utf8");
const actions=readFileSync("src/app/dashboard/actions.ts","utf8");

describe("category usability",()=>{
  it("shows category management by default",()=>expect(page).toContain('<details id="categorias" open'));
  it("reports failures for reorder and visibility actions",()=>{expect(manager).toContain("const run=");expect(manager).toContain("No se pudo completar la acción")});
  it("keeps horizontal category gestures separate from the video feed",()=>{expect(publicMenu).toContain("touch-pan-x");expect(publicMenu).toContain("overscroll-x-contain")});
  it("normalizes names and explains duplicates",()=>{expect(actions).toContain("z.string().trim().min(2)");expect(actions).toContain("Ya existe una categoría con ese nombre.")});
});
