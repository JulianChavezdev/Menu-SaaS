import {expect,test} from "@playwright/test";
import {createClient} from "@supabase/supabase-js";

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey=process.env.SUPABASE_SECRET_KEY??process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin=url&&serviceKey?createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}}):null;
const fixtureSlug=`e2e-mobile-menu-${Date.now()}`;
let fixtureUserId="";let fixtureRestaurantId="";

test.describe("public menu responsive contract",()=>{
  test.beforeAll(async()=>{if(!admin)return;const user=await admin.auth.admin.createUser({email:`${fixtureSlug}@carta-video.local`,password:`Test-${crypto.randomUUID()}!`,email_confirm:true});if(user.error)throw user.error;fixtureUserId=user.data.user.id;const restaurant=await admin.from("restaurants").insert({owner_id:fixtureUserId,name:"Mobile E2E",slug:fixtureSlug,is_published:true,language_switcher_enabled:false}).select("id").single();if(restaurant.error)throw restaurant.error;fixtureRestaurantId=restaurant.data.id;const category=await admin.from("categories").insert({restaurant_id:fixtureRestaurantId,name:"Carta",slug:"carta",is_active:true}).select("id").single();if(category.error)throw category.error;const product=await admin.from("products").insert({restaurant_id:fixtureRestaurantId,category_id:category.data.id,name:"Producto móvil",price_cents:500,is_available:true}).select("id").single();if(product.error)throw product.error});
  test.afterAll(async()=>{if(!admin)return;if(fixtureRestaurantId)await admin.from("restaurants").delete().eq("id",fixtureRestaurantId);if(fixtureUserId)await admin.auth.admin.deleteUser(fixtureUserId)});
  test("keeps a centered phone canvas and vertical product snapping on desktop",async({page})=>{
    await page.setViewportSize({width:1440,height:900});
    await page.goto("/r/bistro-nube",{waitUntil:"domcontentloaded"});

    const menu=page.locator("main.public-menu");
    await expect(menu).toBeVisible();
    const menuBox=await menu.boundingBox();
    expect(menuBox).not.toBeNull();
    expect(menuBox!.width).toBeLessThanOrEqual(403);
    expect(Math.abs(menuBox!.x-(1440-menuBox!.width)/2)).toBeLessThan(2);
    await expect(menu.locator("section")).toHaveCount(15);
    await expect(page.getByText(/01\s*\/\s*03/)).toHaveCount(0);

    for(const details of await page.locator("[data-product-details]").all()){
      const box=await details.boundingBox();
      expect(box?.height??900).toBeLessThan(900*.35);
    }

    await menu.evaluate(element=>element.scrollTo({top:element.clientHeight,behavior:"instant"}));
    await expect.poll(()=>menu.evaluate(element=>element.scrollTop)).toBeGreaterThan(700);
    await expect(page.getByRole("heading",{name:"Papas Voladoras"})).toBeVisible();
    await expect(page.getByRole("navigation",{name:"Controles de la carta"})).toBeVisible();
    await expect(page.getByRole("navigation",{name:"Categorías"})).toBeVisible();
    expect((await page.getByRole("navigation",{name:"Controles de la carta"}).boundingBox())!.width).toBeCloseTo(370,0);

    await page.getByRole("button",{name:"Cambiar a inglés"}).click();
    await expect(page.locator("html")).toHaveAttribute("lang","en");
    await expect(page.getByRole("button",{name:"Menu",exact:true})).toBeVisible();
  });

  test("uses the full mobile viewport and respects a disabled language switcher",async({page})=>{
    test.skip(!admin,"Supabase server credentials are required");
    await page.setViewportSize({width:390,height:844});
    await page.goto(`/r/${fixtureSlug}`,{waitUntil:"domcontentloaded"});

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

  test("autoplays muted inline video on phone and iPad layouts",async({page})=>{
    for(const viewport of [{width:390,height:844},{width:820,height:1180}]){
      await page.setViewportSize(viewport);
      await page.goto("/r/bistro-nube",{waitUntil:"domcontentloaded"});
      const video=page.locator("video").first();
      await expect(video).toHaveAttribute("autoplay","");
      await expect(video).toHaveAttribute("playsinline","");
      await expect.poll(()=>video.evaluate(element=>{const media=element as HTMLVideoElement;return{paused:media.paused,muted:media.muted}})).toEqual({paused:false,muted:true});
      const menuBox=await page.locator("main.public-menu").boundingBox();
      expect(menuBox?.height).toBeCloseTo(viewport.height,0);
      expect(menuBox?.width??999).toBeLessThanOrEqual(viewport.width<768?viewport.width:431);
    }
  });

  test("keeps a local cart with quantities and product notes",async({page})=>{
    await page.setViewportSize({width:390,height:844});
    await page.goto("/r/bistro-nube",{waitUntil:"domcontentloaded"});

    const burger=page.locator("section").filter({has:page.getByRole("heading",{name:"Hamburguesa Nebulosa",exact:true})});
    await burger.getByRole("button",{name:/^Añadir /}).click();
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

  test("shows allergens and a categorized two-column menu",async({page})=>{
    await page.setViewportSize({width:390,height:844});
    await page.goto("/r/bistro-nube",{waitUntil:"domcontentloaded"});

    await expect(page.locator("main.public-menu")).toHaveAttribute("data-hydrated","true");
    await page.getByRole("button",{name:"Carta",exact:true}).dispatchEvent("click");
    const catalog=page.locator('aside[aria-label="Carta"]');
    await expect(catalog).toBeVisible();
    await expect(catalog.getByText("Hamburguesas",{exact:true})).toBeVisible();
    const productGrid=catalog.locator(".grid.grid-cols-2").first();
    await expect(productGrid.locator("article")).not.toHaveCount(0);
    await expect.poll(()=>productGrid.evaluate(element=>getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe(2);
    await expect(catalog.locator("video")).toHaveCount(0);
    await catalog.getByRole("button",{name:"Añadir Hamburguesa Nebulosa"}).click();
    await expect(catalog.getByRole("button",{name:"Hamburguesa Nebulosa añadido al carrito"})).toBeVisible();
    await catalog.getByRole("button",{name:"Cerrar"}).click();

    const burger=page.locator('section[id^="product-"]').filter({has:page.getByRole("heading",{name:"Hamburguesa Nebulosa",exact:true})});
    await burger.getByText("Descripción",{exact:true}).click();
    await expect(burger.getByText(/Alérgenos · 3/)).toBeVisible();
    await expect(burger.getByText("Gluten",{exact:true})).toBeVisible();
    await expect(burger.getByText("Huevos",{exact:true})).toBeVisible();
    await expect(burger.getByText("Leche",{exact:true})).toBeVisible();
    await expect(burger.getByText(/confirma siempre la información con el personal/i)).toBeVisible();
  });

  test("virtualizes videos and jumps directly between categories",async({page})=>{
    await page.setViewportSize({width:402,height:874});
    await page.goto("/r/bistro-nube",{waitUntil:"domcontentloaded"});

    const menu=page.locator("main.public-menu");
    await expect(menu).toHaveAttribute("data-hydrated","true");
    await expect.poll(()=>menu.locator(":scope > div > section video").count()).toBeLessThanOrEqual(2);
    const categories=page.getByRole("navigation",{name:"Categorías"});
    await categories.getByRole("button",{name:"Brasas",exact:true}).click();
    await expect(categories.getByRole("button",{name:"Brasas",exact:true})).toHaveAttribute("aria-current","true");
    const navBox=await categories.boundingBox();
    await expect.poll(async()=>{const activeBox=await categories.getByRole("button",{name:"Brasas",exact:true}).boundingBox();return Math.abs((activeBox!.x+activeBox!.width/2)-(navBox!.x+navBox!.width/2))}).toBeLessThan(3);
    const visibleCategories=await categories.locator("button").evaluateAll((buttons,box)=>buttons.filter(button=>{const rect=button.getBoundingClientRect();return rect.right>(box as {x:number}).x&&rect.left<(box as {x:number;width:number}).x+(box as {width:number}).width}).length,navBox!);
    expect(visibleCategories).toBeLessThanOrEqual(3);
    const addBox=await page.locator('section[id^="product-"]').filter({has:page.getByRole("heading",{name:"Entrecot de Encina",exact:true})}).getByRole("button",{name:/^Añadir /}).boundingBox();
    expect(navBox!.y+navBox!.height).toBeLessThan(addBox!.y);
    const controlsBox=await page.getByRole("navigation",{name:"Controles de la carta"}).boundingBox();
    expect(addBox!.y+addBox!.height).toBeLessThan(controlsBox!.y);
    await categories.getByRole("button",{name:"Postres",exact:true}).click();
    await expect(categories.getByRole("button",{name:"Postres",exact:true})).toHaveAttribute("aria-current","true");
    await expect.poll(()=>menu.locator(":scope > div > section video").count()).toBeLessThanOrEqual(3);
    const dessertVideo=page.locator('section[id^="product-"]').filter({has:page.getByRole("heading",{name:"Tarta Estratos",exact:true})}).locator("video");
    await expect.poll(()=>dessertVideo.evaluate(element=>(element as HTMLVideoElement).paused)).toBe(false);
    await categories.getByRole("button",{name:"Hamburguesas",exact:true}).click();
    const burgerVideo=page.locator('section[id^="product-"]').filter({has:page.getByRole("heading",{name:"Hamburguesa Nebulosa",exact:true})}).locator("video");
    await expect.poll(()=>burgerVideo.evaluate(element=>(element as HTMLVideoElement).paused)).toBe(false);
  });
});
