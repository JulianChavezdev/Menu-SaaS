import {describe,it,expect} from "vitest";
import {demoRestaurant} from "@/lib/demo";
import {MENU_TEMPLATES,resolveMenuTemplate} from "@/lib/menu-templates";
describe("demo template selection",()=>{
  it.each(Object.keys(MENU_TEMPLATES))("renders selected %s without subscription fallback",key=>{
    expect(resolveMenuTemplate(key,["active","trialing"].includes(demoRestaurant.subscription_status??"")).key).toBe(key);
  });
  it("keeps premium access restrictions for ordinary inactive restaurants",()=>{
    expect(resolveMenuTemplate("street",false).key).toBe("cinematic");
  });
});
