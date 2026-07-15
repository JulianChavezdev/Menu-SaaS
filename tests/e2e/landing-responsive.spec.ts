import {expect,test} from "@playwright/test";

test.describe("landing responsive contract",()=>{
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
