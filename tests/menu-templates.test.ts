import {describe,expect,it} from "vitest";
import {DEFAULT_MENU_TEMPLATE,isMenuTemplateKey,MENU_TEMPLATES,resolveMenuTemplate} from "../src/lib/menu-templates";

describe("menu templates",()=>{
  it("resolves the principal template",()=>{expect(resolveMenuTemplate("noirluxe").key).toBe("noirluxe")});
  it("migrates removed templates to the principal template",()=>{expect(resolveMenuTemplate("cinematic",true).key).toBe(DEFAULT_MENU_TEMPLATE)});
  it("keeps the principal template available without a premium plan",()=>{expect(resolveMenuTemplate("noirluxe",false).key).toBe(DEFAULT_MENU_TEMPLATE)});
  it("falls back when a stored key is unknown",()=>{expect(resolveMenuTemplate("removed-template").key).toBe(DEFAULT_MENU_TEMPLATE)});
  it("validates only the principal key",()=>{expect(isMenuTemplateKey("noirluxe")).toBe(true);expect(isMenuTemplateKey("cinematic")).toBe(false)});
  it("keeps NoirLuxe as the sole free principal template",()=>{expect(Object.values(MENU_TEMPLATES)).toHaveLength(1);expect(MENU_TEMPLATES.noirluxe).toMatchObject({name:"Principal",tier:"free",layout:"fullscreen",motif:"noirluxe",colors:{background:"#111111",accent:"#c9a96e",accent2:"#f0e9db"}})});
});
