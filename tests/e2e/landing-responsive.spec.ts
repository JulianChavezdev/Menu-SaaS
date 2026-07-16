import {expect,test} from "@playwright/test";

test.describe("landing responsive contract",()=>{
  test("keeps every section within the viewport across phones, tablets and desktops",async({page})=>{
    const viewports=[
      {name:"iPhone SE",width:375,height:667},
      {name:"iPhone 16 Pro",width:402,height:874},
      {name:"iPhone Pro Max",width:430,height:932},
      {name:"Galaxy S8",width:360,height:740},
      {name:"Pixel 7",width:412,height:915},
      {name:"iPad mini",width:768,height:1024},
      {name:"iPad Pro",width:834,height:1194},
      {name:"tablet landscape",width:1024,height:768},
      {name:"laptop",width:1280,height:800},
      {name:"desktop",width:1440,height:900},
      {name:"wide desktop",width:1920,height:1080},
    ];
    for(const viewport of viewports){
      await test.step(viewport.name,async()=>{
        await page.setViewportSize({width:viewport.width,height:viewport.height});
        await page.goto("/",{waitUntil:"domcontentloaded"});
        expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
        const sections=page.locator("main > section");
        expect(await sections.count()).toBe(6);
        for(const section of await sections.all()){
          const box=await section.boundingBox();
          expect(box!.x).toBeGreaterThanOrEqual(0);
          expect(box!.x+box!.width).toBeLessThanOrEqual(viewport.width);
        }
        const heroActions=page.locator("#contenido").getByRole("link");
        expect(await heroActions.count()).toBe(2);
        for(const action of await heroActions.all()){
          const box=await action.boundingBox();
          expect(box!.x).toBeGreaterThanOrEqual(0);
          expect(box!.x+box!.width).toBeLessThanOrEqual(viewport.width);
        }
        expect(await page.locator("#precios article").count()).toBe(3);
        const menuToggle=page.getByRole("button",{name:"Abrir menú",exact:true});
        expect(await menuToggle.isVisible()).toBe(viewport.width<1024);
      });
    }
  });

  test("presents the complete commercial journey on desktop",async({page})=>{
    await page.setViewportSize({width:1440,height:900});
    await page.goto("/",{waitUntil:"networkidle"});

    await expect(page.getByRole("heading",{name:"Haz que tus platos se vendan solos.",exact:true})).toBeVisible();
    await expect(page.getByRole("navigation",{name:"Navegación principal"})).toBeVisible();
    for(const id of["inicio","producto","como-funciona","precios","faq","contacto"]){
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
    await expect(page.getByRole("link",{name:"Probar la demo",exact:true})).toBeVisible();
    await expect(page.locator("#contenido").getByRole("link",{name:"Crear mi carta",exact:true})).toBeVisible();
    await expect(page.locator('iframe[title="Vista móvil real de Carta Video"]')).toHaveAttribute("src","/r/bistro-nube?preview=landing");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
  });

  test("uses a compact menu without horizontal overflow on mobile",async({page})=>{
    await page.setViewportSize({width:390,height:844});
    await page.goto("/",{waitUntil:"networkidle"});

    const toggle=page.getByRole("button",{name:"Abrir menú",exact:true});
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.getByRole("button",{name:"Cerrar menú",exact:true})).toHaveAttribute("aria-expanded","true");
    await expect(page.locator("header").getByRole("link",{name:"FAQ",exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
