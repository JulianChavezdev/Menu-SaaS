"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {z} from "zod";
import {isMenuTemplateKey} from "@/lib/menu-templates";
import {requireSuperadmin} from "@/lib/superadmin";

const uuid=z.string().uuid();
const status=z.enum(["trialing","active","past_due","canceled"]);
const restaurantInput=z.object({
  restaurant_id:uuid,name:z.string().trim().min(2).max(80),slug:z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description:z.string().trim().max(500),email:z.string().trim().max(200),phone:z.string().trim().max(60),address:z.string().trim().max(250),
  subscription_status:status,menu_template:z.string(),locale:z.enum(["es-ES","en-US","en-GB","es-MX"]),currency:z.enum(["EUR","USD","GBP","MXN"]),
  suspension_reason:z.string().trim().max(250),
});

async function audit(admin:Awaited<ReturnType<typeof requireSuperadmin>>["admin"],actorUserId:string,restaurantId:string,action:string,details:Record<string,unknown>={}){
  await admin.from("superadmin_audit_log").insert({actor_user_id:actorUserId,restaurant_id:restaurantId,action,details}).throwOnError();
}

function refresh(restaurantId:string,slug?:string){revalidatePath("/superadmin");revalidatePath(`/superadmin/restaurants/${restaurantId}`);revalidatePath("/dashboard/billing");if(slug)revalidatePath(`/r/${slug}`)}

export async function recordManualPayment(form:FormData){
  const parsed=z.object({restaurant_id:uuid,amount:z.coerce.number().positive().max(100000),currency:z.enum(["EUR","USD","GBP","MXN"]),paid_at:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),period_end:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),reference:z.string().trim().max(100),notes:z.string().trim().max(500)}).safeParse(Object.fromEntries(form));
  if(!parsed.success)throw new Error("Revisa los datos del pago.");
  const paidAt=new Date(`${parsed.data.paid_at}T12:00:00.000Z`);
  const periodEnd=new Date(`${parsed.data.period_end}T23:59:59.999Z`);
  if(periodEnd<paidAt)throw new Error("El acceso no puede vencer antes del pago.");
  const {admin,user}=await requireSuperadmin();
  const {error}=await admin.rpc("record_manual_payment",{target_restaurant:parsed.data.restaurant_id,payment_amount_cents:Math.round(parsed.data.amount*100),payment_currency:parsed.data.currency,payment_method:"bizum",payment_paid_at:paidAt.toISOString(),payment_period_end:periodEnd.toISOString(),payment_reference:parsed.data.reference,payment_notes:parsed.data.notes,actor_user:user.id});
  if(error)throw new Error(error.message);
  await audit(admin,user.id,parsed.data.restaurant_id,"payment.manual_recorded",{amount_cents:Math.round(parsed.data.amount*100),currency:parsed.data.currency,method:"bizum",period_end:periodEnd.toISOString(),reference:parsed.data.reference||null});
  refresh(parsed.data.restaurant_id);
  redirect(`/superadmin/restaurants/${parsed.data.restaurant_id}?payment=recorded`);
}

export async function processManualExpirations(form:FormData){
  const parsed=z.object({grace_days:z.coerce.number().int().min(0).max(30),operation:z.enum(["mark","suspend"])}).safeParse(Object.fromEntries(form));
  if(!parsed.success)throw new Error("Revisa los días de cortesía.");
  const suspend=parsed.data.operation==="suspend";
  if(suspend&&form.get("confirm_suspension")!=="yes")throw new Error("Confirma la suspensión de las cuentas vencidas.");
  const {admin,user}=await requireSuperadmin();
  const {data,error}=await admin.rpc("process_manual_expirations",{grace_days:parsed.data.grace_days,suspend_access:suspend,actor_user:user.id});
  if(error)throw new Error(error.message);
  revalidatePath("/superadmin");revalidatePath("/dashboard");revalidatePath("/dashboard/billing");
  redirect(`/superadmin?expiration=${suspend?"suspended":"marked"}&processed=${Number(data??0)}`);
}

export async function recordPaymentReminder(form:FormData){
  const parsed=z.object({restaurant_id:uuid,channel:z.enum(["copy","whatsapp","email"]),period_end:z.string().datetime()}).safeParse(Object.fromEntries(form));
  if(!parsed.success)throw new Error("Aviso de pago no válido.");
  const {admin,user}=await requireSuperadmin();
  await audit(admin,user.id,parsed.data.restaurant_id,"payment.reminder_prepared",{channel:parsed.data.channel,period_end:parsed.data.period_end});
  revalidatePath(`/superadmin/restaurants/${parsed.data.restaurant_id}`);
}

export async function updateManagedRestaurant(form:FormData){
  const parsed=restaurantInput.safeParse(Object.fromEntries(form));
  if(!parsed.success)throw new Error("Revisa los datos del restaurante.");
  if(!isMenuTemplateKey(parsed.data.menu_template))throw new Error("Plantilla no válida.");
  const {admin,user}=await requireSuperadmin();
  const suspended=form.get("access_suspended")==="on";
  const published=form.get("is_published")==="on";
  const languageSwitcher=form.get("language_switcher_enabled")==="on";
  const effectiveStatus=suspended?"canceled":parsed.data.subscription_status;
  const {restaurant_id,...values}=parsed.data;
  const {data:current,error:readError}=await admin.from("restaurants").select("access_suspended,suspended_at").eq("id",restaurant_id).single();
  if(readError)throw new Error(readError.message);
  await admin.from("restaurants").update({...values,menu_template:parsed.data.menu_template,subscription_status:effectiveStatus,is_published:published,language_switcher_enabled:languageSwitcher,access_suspended:suspended,suspension_reason:suspended?values.suspension_reason||"Cuenta suspendida manualmente.":null,suspended_at:suspended?(current.suspended_at??new Date().toISOString()):null}).eq("id",restaurant_id).throwOnError();
  await admin.from("subscriptions").update({status:effectiveStatus}).eq("restaurant_id",restaurant_id).throwOnError();
  await audit(admin,user.id,restaurant_id,"restaurant.updated",{subscription_status:effectiveStatus,access_suspended:suspended,is_published:published,menu_template:parsed.data.menu_template});
  refresh(restaurant_id,values.slug);
  redirect(`/superadmin/restaurants/${restaurant_id}?saved=1`);
}

export async function setRestaurantSuspension(form:FormData){
  const restaurantId=uuid.safeParse(form.get("restaurant_id"));
  if(!restaurantId.success)throw new Error("Restaurante no válido.");
  const suspended=form.get("suspended")==="true";
  const {admin,user}=await requireSuperadmin();
  const {data:restaurant,error}=await admin.from("restaurants").select("slug").eq("id",restaurantId.data).single();
  if(error)throw new Error(error.message);
  const nextStatus=suspended?"canceled":"active";
  await admin.from("restaurants").update({access_suspended:suspended,suspension_reason:suspended?"Cuenta suspendida por revisión de pago.":null,suspended_at:suspended?new Date().toISOString():null,subscription_status:nextStatus}).eq("id",restaurantId.data).throwOnError();
  await admin.from("subscriptions").update({status:nextStatus}).eq("restaurant_id",restaurantId.data).throwOnError();
  await audit(admin,user.id,restaurantId.data,suspended?"access.suspended":"access.restored",{reason:suspended?"payment_review":null});
  refresh(restaurantId.data,restaurant.slug);
}

export async function updateManagedCategory(form:FormData){
  const parsed=z.object({restaurant_id:uuid,category_id:uuid,name:z.string().trim().min(1).max(80)}).safeParse(Object.fromEntries(form));
  if(!parsed.success)throw new Error("Categoría no válida.");
  const {admin,user}=await requireSuperadmin();
  await admin.from("categories").update({name:parsed.data.name}).eq("id",parsed.data.category_id).eq("restaurant_id",parsed.data.restaurant_id).throwOnError();
  await audit(admin,user.id,parsed.data.restaurant_id,"category.updated",{category_id:parsed.data.category_id,name:parsed.data.name});refresh(parsed.data.restaurant_id);
}

export async function updateManagedProduct(form:FormData){
  const parsed=z.object({restaurant_id:uuid,product_id:uuid,name:z.string().trim().min(1).max(120),description:z.string().trim().max(500),price:z.coerce.number().min(0).max(100000),category_id:uuid}).safeParse(Object.fromEntries(form));
  if(!parsed.success)throw new Error("Producto no válido.");
  const {admin,user}=await requireSuperadmin();
  await admin.from("products").update({name:parsed.data.name,description:parsed.data.description||null,price_cents:Math.round(parsed.data.price*100),category_id:parsed.data.category_id}).eq("id",parsed.data.product_id).eq("restaurant_id",parsed.data.restaurant_id).throwOnError();
  await audit(admin,user.id,parsed.data.restaurant_id,"product.updated",{product_id:parsed.data.product_id,name:parsed.data.name});refresh(parsed.data.restaurant_id);
}

export async function setManagedProductAvailability(form:FormData){
  const restaurantId=uuid.safeParse(form.get("restaurant_id"));const productId=uuid.safeParse(form.get("product_id"));
  if(!restaurantId.success||!productId.success)throw new Error("Producto no válido.");
  const available=form.get("available")==="true";const {admin,user}=await requireSuperadmin();
  await admin.from("products").update({is_available:available}).eq("id",productId.data).eq("restaurant_id",restaurantId.data).throwOnError();
  await audit(admin,user.id,restaurantId.data,"product.availability",{product_id:productId.data,is_available:available});refresh(restaurantId.data);
}

export async function setManagedCategoryVisibility(form:FormData){
  const restaurantId=uuid.safeParse(form.get("restaurant_id"));const categoryId=uuid.safeParse(form.get("category_id"));
  if(!restaurantId.success||!categoryId.success)throw new Error("Categoría no válida.");
  const active=form.get("active")==="true";const {admin,user}=await requireSuperadmin();
  await admin.from("categories").update({is_active:active}).eq("id",categoryId.data).eq("restaurant_id",restaurantId.data).throwOnError();
  await audit(admin,user.id,restaurantId.data,"category.visibility",{category_id:categoryId.data,is_active:active});refresh(restaurantId.data);
}
