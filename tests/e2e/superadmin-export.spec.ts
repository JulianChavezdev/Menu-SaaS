import {readFile} from "node:fs/promises";
import {createClient} from "@supabase/supabase-js";
import {expect,test} from "@playwright/test";

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey=process.env.SUPABASE_SECRET_KEY??process.env.SUPABASE_SERVICE_ROLE_KEY;
const enabled=Boolean(url&&serviceKey);
const email="e2e-export-admin@carta-video.local";
const password=`Export-${crypto.randomUUID()}!`;
const stamp=`${Date.now()}-${crypto.randomUUID()}`;
const admin=enabled?createClient(url!,serviceKey!,{auth:{persistSession:false,autoRefreshToken:false}}):null;
let userId="";
let restaurantId="";
let productId="";

test.describe("superadmin restaurant exports",()=>{
  test.skip(!enabled,"Supabase server credentials are required");
  test.beforeAll(async()=>{
    const user=await admin!.auth.admin.createUser({email,password,email_confirm:true});
    if(user.error)throw user.error;
    userId=user.data.user.id;
    const restaurant=await admin!.from("restaurants").insert({owner_id:userId,name:"Export E2E",slug:`export-e2e-${stamp}`}).select("id").single();
    if(restaurant.error)throw restaurant.error;
    restaurantId=restaurant.data.id;
    const member=await admin!.from("restaurant_members").insert({restaurant_id:restaurantId,user_id:userId,role:"owner"});
    if(member.error)throw member.error;
    const category=await admin!.from("categories").insert({restaurant_id:restaurantId,name:"Postres",slug:"postres"}).select("id").single();
    if(category.error)throw category.error;
    const product=await admin!.from("products").insert({restaurant_id:restaurantId,category_id:category.data.id,name:"Tarta exportada",description:"Respaldo verificable",price_cents:650}).select("id").single();
    if(product.error)throw product.error;
    productId=product.data.id;
  });
  test.afterAll(async()=>{
    if(restaurantId)await admin!.from("superadmin_audit_log").delete().eq("restaurant_id",restaurantId);
    if(restaurantId)await admin!.from("restaurants").delete().eq("id",restaurantId);
    if(userId)await admin!.auth.admin.deleteUser(userId);
  });

  test("blocks anonymous access and downloads valid JSON and CSV",async({page,request})=>{
    const blocked=await request.get(`/api/superadmin/restaurants/${restaurantId}/export`);
    expect(blocked.status()).toBe(401);
    const blockedRestore=await request.post(`/api/superadmin/restaurants/${restaurantId}/restore?mode=preview`,{data:{}});
    expect(blockedRestore.status()).toBe(401);

    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill(email);
    await page.locator("#login-password").fill(password);
    await page.getByRole("button",{name:"Entrar al panel"}).click();
    await expect(page).toHaveURL(/\/(dashboard|onboarding)$/,{timeout:30_000});
    await page.goto(`/superadmin/restaurants/${restaurantId}`);
    await expect(page.getByRole("heading",{name:"Export E2E"})).toBeVisible();

    const jsonDownloadPromise=page.waitForEvent("download");
    await page.getByRole("link",{name:"Copia completa JSON"}).click();
    const jsonDownload=await jsonDownloadPromise;
    const jsonPath=await jsonDownload.path();
    const backup=JSON.parse(await readFile(jsonPath!,"utf8"));
    expect(backup).toMatchObject({format:"carta-video.restaurant-backup",version:1,restaurant:{id:restaurantId,name:"Export E2E"},mediaFilesIncluded:false});
    expect(backup.products[0]).toMatchObject({name:"Tarta exportada",price_cents:650});

    const csvDownloadPromise=page.waitForEvent("download");
    await page.getByRole("link",{name:"Carta en CSV"}).click();
    const csvDownload=await csvDownloadPromise;
    const csvPath=await csvDownload.path();
    const csv=await readFile(csvPath!,"utf8");
    expect(csv).toContain("Tarta exportada");
    expect(csv).toContain("Postres");

    await page.locator('input[type="file"]').setInputFiles(jsonPath!);
    await expect(page.getByText("Copia del",{exact:false})).toBeVisible();
    await expect(page.getByText("Los miembros, pagos, plan",{exact:false})).toBeVisible();
    const restoreButton=page.getByRole("button",{name:"Aplicar restauración"});
    await expect(restoreButton).toBeDisabled();
    await page.getByLabel(`Escribe ${`export-e2e-${stamp}`} para confirmar`).fill(`export-e2e-${stamp}`);
    await expect(restoreButton).toBeEnabled();
    const changed=await admin!.from("products").update({name:"Tarta modificada"}).eq("id",productId);
    if(changed.error)throw changed.error;
    await restoreButton.click();
    await expect.poll(async()=>{
      const result=await admin!.from("products").select("name").eq("id",productId).single();
      return result.data?.name;
    }).toBe("Tarta exportada");
    const audit=await admin!.from("superadmin_audit_log").select("action").eq("restaurant_id",restaurantId).eq("action","restaurant.backup_restored").single();
    expect(audit.error).toBeNull();
  });
});
