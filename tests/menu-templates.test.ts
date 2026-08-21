import {describe,expect,it} from "vitest";
import {DEFAULT_MENU_TEMPLATE,isMenuTemplateKey,MENU_TEMPLATES,resolveMenuTemplate} from "../src/lib/menu-templates";

describe("menu templates",()=>{
  it("resolves the current template",()=>{expect(resolveMenuTemplate("cinematic").key).toBe("cinematic")});
  it("resolves premium templates for active subscriptions",()=>{expect(resolveMenuTemplate("midnight",true).key).toBe("midnight")});
  it("falls back when premium access is unavailable",()=>{expect(resolveMenuTemplate("midnight",false).key).toBe(DEFAULT_MENU_TEMPLATE)});
  it("falls back when a stored key is unknown",()=>{expect(resolveMenuTemplate("removed-template").key).toBe(DEFAULT_MENU_TEMPLATE)});
  it("validates keys before persisting them",()=>{expect(isMenuTemplateKey("cinematic")).toBe(true);expect(isMenuTemplateKey("premium-fake")).toBe(false)});
  it("includes NoirLuxe as a premium Figma-based template",()=>{expect(MENU_TEMPLATES.noirluxe).toMatchObject({tier:"premium",layout:"fullscreen",motif:"noirluxe",colors:{background:"#111111",accent:"#c9a96e",accent2:"#f0e9db"}})});
  it("offers eight themes with exactly two free options",()=>{const templates=Object.values(MENU_TEMPLATES);expect(templates).toHaveLength(8);expect(templates.filter(item=>item.tier==="free")).toHaveLength(2);expect(templates.filter(item=>item.tier==="premium")).toHaveLength(6)});
  it("gives every theme its own visual motif and palette",()=>{const templates=Object.values(MENU_TEMPLATES);expect(new Set(templates.map(item=>item.motif)).size).toBe(8);expect(new Set(templates.map(item=>item.colors.background)).size).toBe(8)});
});
