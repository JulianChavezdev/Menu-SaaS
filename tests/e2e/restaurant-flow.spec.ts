import {createClient} from "@supabase/supabase-js";
import {expect,test} from "@playwright/test";

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const enabled=Boolean(url&&serviceKey);
const email=`e2e-${Date.now()}@carta-video.local`;
const password=`Test-${crypto.randomUUID()}!`;
const slug=`e2e-restaurante-${Date.now()}`;
const tinyPng=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=","base64");
let userId="";
const admin=enabled?createClient(url!,serviceKey!,{auth:{persistSession:false,autoRefreshToken:false}}):null;

test.describe("restaurant owner journey",()=>{
  test.skip(!enabled,"Supabase server credentials are required");
  test.beforeAll(async()=>{
    const {data,error}=await admin!.auth.admin.createUser({email,password,email_confirm:true});
    if(error)throw error;
    userId=data.user.id;
  });
  test.afterAll(async()=>{
    if(!admin||!userId)return;
    const {data:restaurants}=await admin.from("restaurants").select("id").eq("owner_id",userId);
    for(const restaurant of restaurants??[])await admin.from("restaurants").delete().eq("id",restaurant.id);
    await admin.auth.admin.deleteUser(userId);
  });

  test("login, onboarding, logo, product creation and public menu",async({page})=>{
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Correo electrónico").fill(email);
    await page.locator("#login-password").fill(password);
    await page.getByRole("button",{name:"Mostrar clave"}).click();
    await expect(page.locator("#login-password")).toHaveAttribute("type","text");
    await page.getByRole("button",{name:"Ocultar clave"}).click();
    await expect(page.locator("#login-password")).toHaveAttribute("type","password");
    await page.getByRole("button",{name:"Entrar al panel"}).click();
    await expect(page).not.toHaveURL(/\/login$/);

    await page.goto("/onboarding");
    await page.getByLabel("Nombre").fill("Restaurante E2E");
    await page.getByLabel("Slug público").fill(slug);
    await page.getByRole("button",{name:"Crear restaurante"}).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByRole("link",{name:"Carta",exact:true}).click();
    await page.getByLabel("Nombre").fill("Producto E2E");
    await page.getByLabel("Descripción").fill("Producto creado mediante una prueba completa.");
    await page.getByLabel("Precio (€)").fill("9.50");
    await page.getByLabel("Categoría").selectOption({label:"Entrantes"});
    await page.getByRole("button",{name:"Crear producto"}).click();
    await expect(page.getByRole("heading",{name:"Producto E2E",exact:true})).toBeVisible();

    await page.getByRole("link",{name:"Apariencia",exact:true}).click();
    await page.waitForLoadState("networkidle");
    await page.locator('input[accept="image/jpeg,image/png,image/webp"]').setInputFiles({name:"logo.png",mimeType:"image/png",buffer:tinyPng});
    await expect(page.getByRole("button",{name:"Confirmar subida"})).toBeVisible();
    await page.getByRole("button",{name:"Confirmar subida"}).click();
    await expect(page.getByText("Archivo actual guardado. Puedes reemplazarlo.")).toBeVisible();

    await page.getByRole("link",{name:"Restaurante",exact:true}).click();
    await page.getByLabel("Publicar carta").check();
    await page.getByRole("button",{name:"Guardar cambios"}).click();
    await expect.poll(async()=>{
      const {data}=await admin!.from("restaurants").select("is_published").eq("slug",slug).single();
      return data?.is_published;
    }).toBe(true);

    await page.goto(`/r/${slug}`);
    await expect(page.getByRole("heading",{name:"Producto E2E"})).toBeVisible();
    await expect(page.getByText("9,50 €")).toBeVisible();
    await expect(page.getByRole("img",{name:"Logo de Restaurante E2E"})).toBeVisible();
    await expect(page.getByRole("navigation",{name:"Controles de la carta"})).toBeVisible();
  });
});
