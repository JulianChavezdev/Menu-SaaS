import {expect,test} from "@playwright/test";

const devices=[
  {name:"iPhone SE",width:375,height:667},
  {name:"iPhone 12/13",width:390,height:844},
  {name:"iPhone 14 Pro",width:393,height:852},
  {name:"iPhone 16 Pro",width:402,height:874},
  {name:"iPhone Pro Max",width:430,height:932},
  {name:"Galaxy S8",width:360,height:740},
  {name:"Galaxy S20",width:360,height:800},
  {name:"Galaxy A51",width:412,height:914},
  {name:"Pixel 5",width:393,height:851},
  {name:"Pixel 7",width:412,height:915},
  {name:"iPad mini",width:768,height:1024},
  {name:"iPad Pro",width:834,height:1194},
];

test("description and allergens never overlap navigation across devices",async({page})=>{
  await page.route(/\.mp4(?:$|\?)/,route=>route.abort());
  for(const device of devices){
    await test.step(device.name,async()=>{
      await page.setViewportSize({width:device.width,height:device.height});
      await page.goto("/r/bistro-nube",{waitUntil:"domcontentloaded"});
      const menu=page.locator("main.public-menu");
      await expect(menu).toHaveAttribute("data-hydrated","true");
      const product=page.locator('section[id^="product-"]').first();
      const detailsPanel=product.locator("[data-product-details]");
      const description=product.locator("details").nth(0);
      const allergens=product.locator("details").nth(1);
      await description.locator("summary").click();
      await expect(description).toHaveAttribute("open","");
      const controlsBox=await page.getByRole("navigation",{name:"Controles de la carta"}).boundingBox();
      const descriptionBox=await description.boundingBox();
      expect(descriptionBox!.y+descriptionBox!.height).toBeLessThanOrEqual(controlsBox!.y-4);
      await allergens.locator("summary").click();
      await expect(allergens).toHaveAttribute("open","");
      await expect.poll(()=>detailsPanel.evaluate(element=>element.scrollTop)).toBeGreaterThanOrEqual(0);
      const panelBox=await detailsPanel.boundingBox();
      const categoryBox=await page.getByRole("navigation",{name:"Categorías"}).boundingBox();
      const addBox=await product.getByRole("button",{name:"Añadir",exact:true}).boundingBox();
      expect(panelBox!.y).toBeGreaterThanOrEqual(categoryBox!.y+categoryBox!.height+4);
      expect(panelBox!.y+panelBox!.height).toBeLessThanOrEqual(controlsBox!.y-4);
      expect(addBox!.y+addBox!.height).toBeLessThan(controlsBox!.y);
      expect(controlsBox!.y+controlsBox!.height).toBeLessThanOrEqual(device.height);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(device.width);
      expect(await menu.locator(":scope > div > section video").count()).toBeLessThanOrEqual(2);
    });
  }
});
