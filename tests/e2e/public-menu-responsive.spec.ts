import {expect,test} from "@playwright/test";

test.describe("public menu responsive contract",()=>{
  test("keeps a centered phone canvas and vertical product snapping on desktop",async({page})=>{
    await page.setViewportSize({width:1440,height:900});
    await page.goto("/r/bistro-nube",{waitUntil:"domcontentloaded"});

    const menu=page.locator("main.public-menu");
    await expect(menu).toBeVisible();
    const menuBox=await menu.boundingBox();
    expect(menuBox).not.toBeNull();
    expect(menuBox!.width).toBeLessThanOrEqual(431);
    expect(Math.abs(menuBox!.x-(1440-menuBox!.width)/2)).toBeLessThan(2);
    await expect(menu.locator("section")).toHaveCount(3);
    await expect(page.getByText(/01\s*\/\s*03/)).toHaveCount(0);

    for(const details of await page.locator("[data-product-details]").all()){
      const box=await details.boundingBox();
      expect(box?.height??900).toBeLessThan(900*.35);
    }

    await menu.evaluate(element=>element.scrollTo({top:element.clientHeight,behavior:"instant"}));
    await expect.poll(()=>menu.evaluate(element=>element.scrollTop)).toBeGreaterThan(700);
    await expect(page.getByRole("heading",{name:"Papas Voladoras"})).toBeVisible();
    await expect(page.getByRole("navigation",{name:"Controles de la carta"})).toBeVisible();

    await page.getByRole("button",{name:"Cambiar a inglés"}).click();
    await expect(page.locator("html")).toHaveAttribute("lang","en");
    await expect(page.getByRole("button",{name:"Menu",exact:true})).toBeVisible();
  });

  test("uses the full mobile viewport and respects a disabled language switcher",async({page})=>{
    await page.setViewportSize({width:390,height:844});
    await page.goto("/r/cafe-central",{waitUntil:"domcontentloaded"});

    const menu=page.locator("main.public-menu");
    await expect(menu).toBeVisible();
    const menuBox=await menu.boundingBox();
    expect(menuBox).not.toBeNull();
    expect(menuBox!.x).toBeCloseTo(0,0);
    expect(menuBox!.width).toBeCloseTo(390,0);
    expect(menuBox!.height).toBeCloseTo(844,0);
    await expect(page.getByRole("button",{name:"Cambiar a inglés"})).toHaveCount(0);
    await expect(page.getByRole("navigation",{name:"Controles de la carta"})).toBeVisible();
  });

  test("keeps a local cart with quantities and product notes",async({page})=>{
    await page.setViewportSize({width:390,height:844});
    await page.goto("/r/bistro-nube",{waitUntil:"domcontentloaded"});

    const burger=page.locator("section").filter({has:page.getByRole("heading",{name:"Hamburguesa Nebulosa",exact:true})});
    await burger.getByRole("button",{name:"Añadir",exact:true}).click();
    await expect(page.getByRole("button",{name:"Carrito: 1"})).toBeVisible();
    await page.getByRole("button",{name:"Carrito: 1"}).click();
    await expect(page.getByRole("heading",{name:"Carrito · 1"})).toBeVisible();
    await page.getByPlaceholder("Añade o quita ingredientes").fill("Sin cebolla, añade queso");
    await expect(page.getByText("Guardado en este dispositivo. No se envía a cocina.")).toBeVisible();

    await page.reload({waitUntil:"domcontentloaded"});
    await page.getByRole("button",{name:"Carrito: 1"}).click();
    await expect(page.getByPlaceholder("Añade o quita ingredientes")).toHaveValue("Sin cebolla, añade queso");
    await page.getByRole("button",{name:"Añadir una unidad de Hamburguesa Nebulosa"}).click();
    await expect(page.getByRole("heading",{name:"Carrito · 2"})).toBeVisible();
  });
});
