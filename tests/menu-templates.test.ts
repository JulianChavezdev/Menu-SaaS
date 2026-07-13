import {describe,expect,it} from "vitest";
import {DEFAULT_MENU_TEMPLATE,isMenuTemplateKey,resolveMenuTemplate} from "../src/lib/menu-templates";

describe("menu templates",()=>{
  it("resolves the current template",()=>{expect(resolveMenuTemplate("cinematic").key).toBe("cinematic")});
  it("resolves premium templates for active subscriptions",()=>{expect(resolveMenuTemplate("midnight",true).key).toBe("midnight")});
  it("falls back when premium access is unavailable",()=>{expect(resolveMenuTemplate("midnight",false).key).toBe(DEFAULT_MENU_TEMPLATE)});
  it("falls back when a stored key is unknown",()=>{expect(resolveMenuTemplate("removed-template").key).toBe(DEFAULT_MENU_TEMPLATE)});
  it("validates keys before persisting them",()=>{expect(isMenuTemplateKey("cinematic")).toBe(true);expect(isMenuTemplateKey("premium-fake")).toBe(false)});
});
