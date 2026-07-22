import {createClient} from "@supabase/supabase-js";
import {expect,test} from "@playwright/test";

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey=process.env.SUPABASE_SECRET_KEY??process.env.SUPABASE_SERVICE_ROLE_KEY;
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
    for(const restaurant of restaurants??[]){
      const prefix=`restaurants/${restaurant.id}/branding`;
      const {data:logos}=await admin.storage.from("restaurant-media").list(prefix,{limit:100});
      const paths=(logos??[]).filter(item=>item.id).map(item=>`${prefix}/${item.name}`);
      if(paths.length)await admin.storage.from("restaurant-media").remove(paths);
      await admin.from("restaurants").delete().eq("id",restaurant.id);
    }
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
    await expect(page).toHaveURL(/\/(dashboard|onboarding)$/,{timeout:15_000});

    await page.goto("/onboarding");
    await page.getByLabel("Nombre").fill("Restaurante E2E");
    await page.getByLabel("Slug público").fill(slug);
    await page.getByRole("button",{name:"Crear restaurante"}).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    const created=await admin!.from("restaurants").select("id,subscription_status").eq("slug",slug).single();
    expect(created.data?.subscription_status).toBe("past_due");
    await admin!.from("restaurants").update({subscription_status:"active",publication_suspended_for_payment:false}).eq("id",created.data!.id).throwOnError();
    await admin!.from("subscriptions").update({status:"active",provider:"manual",current_period_end:new Date(Date.now()+60*24*60*60*1000).toISOString()}).eq("restaurant_id",created.data!.id).throwOnError();

    await page.getByRole("link",{name:"Carta",exact:true}).click();
    await page.locator("details#categorias > summary").click();
    const categoryForm=page.locator("details#categorias form");
    await categoryForm.getByLabel("Nombre").fill("Entrantes");
    await categoryForm.getByRole("button",{name:"Crear categoría"}).click();
    await expect(page.getByText("Entrantes",{exact:true}).first()).toBeVisible();
    const productForm=page.locator("form").filter({has:page.getByRole("heading",{name:"Nuevo producto"})});
    await productForm.getByLabel("Nombre",{exact:true}).fill("Producto E2E");
    await productForm.getByLabel("Descripción",{exact:true}).fill("Producto creado mediante el flujo completo.");
    await expect(productForm.getByText("La versión inglesa se genera automáticamente al guardar.")).toBeVisible();
    await productForm.getByLabel("Precio (€)").fill("9.50");
    await productForm.getByLabel("Categoría").selectOption({label:"Entrantes"});
    await productForm.getByRole("button",{name:"Crear producto"}).click();
    await expect(page.getByRole("heading",{name:"Producto E2E",exact:true})).toBeVisible();

    await page.goto("/dashboard/appearance");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("radio",{name:"Seleccionar plantilla Medianoche"})).toBeEnabled();
    await page.getByRole("button",{name:"Vista previa de Medianoche"}).click();
    await expect(page.getByRole("dialog",{name:"Vista previa de Medianoche"})).toBeVisible();
    await page.getByRole("button",{name:"Cerrar vista previa"}).click();
    await page.locator('input[accept="image/jpeg,image/png,image/webp"]').setInputFiles({name:"logo.png",mimeType:"image/png",buffer:tinyPng});
    await expect(page.getByRole("button",{name:"Confirmar subida"})).toBeVisible();
    await page.getByRole("button",{name:"Confirmar subida"}).click();
    await expect(page.getByText("Archivo actual guardado. Puedes reemplazarlo.")).toBeVisible();
    await page.getByLabel("Mostrar selector de idioma").check();
    await page.getByRole("button",{name:"Guardar preferencias"}).click();

    await page.getByRole("link",{name:"Restaurante",exact:true}).click();
    await page.getByLabel("Publicar carta").check();
    await page.getByRole("button",{name:"Guardar cambios"}).click();
    await expect.poll(async()=>{
      const {data}=await admin!.from("restaurants").select("is_published").eq("slug",slug).single();
      return data?.is_published;
    }).toBe(true);

    await page.setViewportSize({width:390,height:844});
    await page.goto(`/r/${slug}`);
    await expect(page.getByRole("heading",{name:"Producto E2E"})).toBeVisible();
    await expect(page.getByText("9,50 €")).toBeVisible();
    await expect(page.getByRole("img",{name:"Logo de Restaurante E2E"}).first()).toBeVisible();
    await expect(page.getByRole("navigation",{name:"Controles de la carta"})).toBeVisible();
    const detailsBox=await page.locator("[data-product-details]").boundingBox();
    expect(detailsBox?.height??844).toBeLessThan(844*.35);
    await page.getByRole("button",{name:"Cambiar a inglés"}).click();
    await expect(page.getByRole("heading",{name:"Producto E2E"})).toBeVisible();
    await page.getByText("Description",{exact:true}).click();
    await expect(page.getByText("Producto creado mediante el flujo completo.")).toBeVisible();
  });
});
