import dotenv from "dotenv";
import {readFile} from "node:fs/promises";
import {createClient} from "@supabase/supabase-js";

dotenv.config({path:".env.local",quiet:true});

const apply=process.argv.includes("--apply");
const recommendationsOnly=process.argv.includes("--recommendations-only");
const data=JSON.parse(await readFile(new URL("../supabase/showcase-data.json",import.meta.url),"utf8"));
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
const publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if(!url||!serviceKey||!publicKey)throw new Error("Faltan las credenciales de Supabase en .env.local.");
const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
const anonymous=createClient(url,publicKey,{auth:{persistSession:false,autoRefreshToken:false}});
const ownerEmail=(process.env.DEMO_OWNER_EMAIL||data.ownerEmail).toLowerCase();

async function findOwner(){
  for(let page=1;page<=20;page++){
    const {data:users,error}=await admin.auth.admin.listUsers({page,perPage:100});
    if(error)throw error;
    const owner=users.users.find(user=>user.email?.toLowerCase()===ownerEmail);
    if(owner)return owner;
    if(users.users.length<100)break;
  }
  if(!apply)throw new Error(`No existe el propietario demo ${ownerEmail}. Ejecuta el seed para crearlo.`);
  const {data:created,error}=await admin.auth.admin.createUser({email:ownerEmail,password:`Demo-${crypto.randomUUID()}-A1!`,email_confirm:true,user_metadata:{full_name:"Propietario demo"}});
  if(error||!created.user)throw error??new Error("No se pudo crear el propietario demo.");
  return created.user;
}

async function inspect(ownerId){
  const slugs=data.restaurants.map(item=>item.slug);
  const {data:restaurants,error}=await admin.from("restaurants").select("id,owner_id,name,slug,menu_template,is_published,categories(count),products(count)").in("slug",slugs).order("slug");
  if(error)throw error;
  const collision=restaurants?.find(item=>item.owner_id!==ownerId);
  if(collision)throw new Error(`El slug ${collision.slug} pertenece a otro usuario; no se modificó nada.`);
  return restaurants??[];
}

async function inspectLegacy(ownerId){
  const legacySlugs=data.legacyDemoSlugs??[];
  if(!legacySlugs.length)return[];
  const {data:restaurants,error}=await admin.from("restaurants").select("id,owner_id,name,slug,categories(count),products(count)").in("slug",legacySlugs).order("slug");
  if(error)throw error;
  const collision=restaurants?.find(item=>item.owner_id!==ownerId);
  if(collision)throw new Error(`El slug ${collision.slug} pertenece a otro usuario; no se modificó nada.`);
  return restaurants??[];
}

async function backupLegacyRestaurants(legacy){
  if(!legacy.length)return null;
  const ids=legacy.map(item=>item.id);
  const [restaurants,categories,products,memberships,subscriptions,payments]=await Promise.all([
    admin.from("restaurants").select("*").in("id",ids),admin.from("categories").select("*").in("restaurant_id",ids),admin.from("products").select("*").in("restaurant_id",ids),admin.from("restaurant_members").select("*").in("restaurant_id",ids),admin.from("subscriptions").select("*").in("restaurant_id",ids),admin.from("manual_payments").select("*").in("restaurant_id",ids),
  ]);
  const failed=[restaurants,categories,products,memberships,subscriptions,payments].find(result=>result.error);if(failed?.error)throw failed.error;
  const {data:backup,error}=await admin.from("superadmin_audit_log").insert({actor_user_id:null,restaurant_id:null,action:"showcase.consolidation_backup_created",details:{format:"carta-video.showcase-consolidation",version:1,target_slug:data.restaurants[0]?.slug,restaurants:restaurants.data??[],categories:categories.data??[],products:products.data??[],memberships:memberships.data??[],subscriptions:subscriptions.data??[],payments:payments.data??[]}}).select("id").single();
  if(error)throw error;return backup.id;
}

async function seedRecommendations(restaurantId,restaurant){
  const {data:products,error}=await admin.from("products").select("id,name").eq("restaurant_id",restaurantId);
  if(error)throw error;
  const productIds=new Map(products.map(product=>[product.name,product.id]));
  const recommendations=restaurant.products.flatMap(product=>(product.recommendations??[]).map((recommendedName,sort_order)=>({restaurant_id:restaurantId,source_product_id:productIds.get(product.name),recommended_product_id:productIds.get(recommendedName),sort_order})));
  if(recommendations.some(item=>!item.source_product_id||!item.recommended_product_id))throw new Error(`Recomendación desconocida en ${restaurant.slug}.`);
  await admin.from("product_recommendations").delete().eq("restaurant_id",restaurantId).throwOnError();
  if(recommendations.length)await admin.from("product_recommendations").insert(recommendations).throwOnError();
}

async function seed(ownerId){
  await inspect(ownerId);
  const legacy=await inspectLegacy(ownerId);const backupAuditId=await backupLegacyRestaurants(legacy);
  for(const restaurant of data.restaurants){
    const values={owner_id:ownerId,name:restaurant.name,slug:restaurant.slug,description:restaurant.description,logo_url:restaurant.logoUrl,cover_url:null,primary_color:"#111827",secondary_color:"#f8fafc",currency:"EUR",locale:"es-ES",timezone:"Europe/Madrid",is_published:true,plan:"carta",subscription_status:"active",language_switcher_enabled:restaurant.languageSwitcherEnabled,menu_template:restaurant.template,access_suspended:false,suspension_reason:null,suspended_at:null};
    const {data:saved,error}=await admin.from("restaurants").upsert(values,{onConflict:"slug"}).select("id").single();
    if(error)throw error;
    await admin.from("restaurant_members").upsert({restaurant_id:saved.id,user_id:ownerId,role:"owner"},{onConflict:"restaurant_id,user_id"}).throwOnError();
    await admin.from("subscriptions").upsert({restaurant_id:saved.id,provider:"manual",plan:"carta",status:"active"},{onConflict:"restaurant_id"}).throwOnError();
    await admin.from("products").delete().eq("restaurant_id",saved.id).throwOnError();
    await admin.from("categories").delete().eq("restaurant_id",saved.id).throwOnError();
    const {data:categories,error:categoryError}=await admin.from("categories").insert(restaurant.categories.map((category,index)=>({restaurant_id:saved.id,name:category.name,slug:category.slug,sort_order:index,is_active:true}))).select("id,slug");
    if(categoryError)throw categoryError;
    const categoryIds=new Map(categories.map(category=>[category.slug,category.id]));
    const products=restaurant.products.map((product,index)=>({restaurant_id:saved.id,category_id:categoryIds.get(product.category),name:product.name,description:product.description,price_cents:product.priceCents,video_url:product.videoUrl,video_path:null,image_url:null,image_path:null,is_available:true,is_featured:index===0,sort_order:index}));
    if(products.some(product=>!product.category_id))throw new Error(`Categoría desconocida en ${restaurant.slug}.`);
    const {error:productError}=await admin.from("products").insert(products);
    if(productError)throw productError;
    await seedRecommendations(saved.id,restaurant);
  }
  if(legacy.length){
    const {error}=await admin.from("restaurants").delete().eq("owner_id",ownerId).in("id",legacy.map(item=>item.id));
    if(error)throw error;
    await admin.from("superadmin_audit_log").insert({actor_user_id:null,restaurant_id:null,action:"showcase.restaurants_consolidated",details:{target_slug:data.restaurants[0]?.slug,backup_audit_id:backupAuditId,deleted_restaurants:legacy.map(item=>({id:item.id,slug:item.slug,name:item.name,categories:item.categories?.[0]?.count??0,products:item.products?.[0]?.count??0}))}}).throwOnError();
  }
}

const owner=await findOwner();
if(apply&&recommendationsOnly){const current=await inspect(owner.id);for(const row of current){const restaurant=data.restaurants.find(item=>item.slug===row.slug);if(restaurant)await seedRecommendations(row.id,restaurant)}}else if(apply)await seed(owner.id);
const rows=await inspect(owner.id);
const legacyRows=await inspectLegacy(owner.id);
const expected=new Map(data.restaurants.map(item=>[item.slug,item]));
let complete=legacyRows.length===0&&rows.length===expected.size&&rows.every(row=>{const item=expected.get(row.slug);return item?.template===row.menu_template&&row.is_published&&row.categories?.[0]?.count===item.categories.length&&row.products?.[0]?.count===item.products.length});
for(const row of rows){
  const {data:products,error}=await anonymous.from("products").select("id,name,restaurant_id").eq("restaurant_id",row.id).order("sort_order");
  if(error)throw error;
  const expectedNames=expected.get(row.slug)?.products.map(product=>product.name)??[];
  if(products?.some(product=>product.restaurant_id!==row.id)||JSON.stringify(products?.map(product=>product.name))!==JSON.stringify(expectedNames))complete=false;
  const {data:recommendations,error:recommendationError}=await anonymous.from("product_recommendations").select("source_product_id,recommended_product_id").eq("restaurant_id",row.id);
  if(recommendationError)throw recommendationError;
  const idToName=new Map((products??[]).map(product=>[product.id,product.name]));
  const expectedPairs=new Set((expected.get(row.slug)?.products??[]).flatMap(product=>(product.recommendations??[]).map(recommended=>`${product.name}|${recommended}`)));
  const actualPairs=new Set((recommendations??[]).map(item=>`${idToName.get(item.source_product_id)}|${idToName.get(item.recommended_product_id)}`));
  if(expectedPairs.size!==actualPairs.size||[...expectedPairs].some(pair=>!actualPairs.has(pair)))complete=false;
}
console.table(rows.map(row=>({slug:row.slug,template:row.menu_template,categories:row.categories?.[0]?.count??0,products:row.products?.[0]?.count??0,published:row.is_published})));
if(!complete)throw new Error(apply?"El escaparate no quedó completo.":"El escaparate todavía no está sembrado. Ejecuta npm run seed:showcase.");
const categoryCount=data.restaurants.reduce((total,item)=>total+item.categories.length,0);const productCount=data.restaurants.reduce((total,item)=>total+item.products.length,0);
const recommendationCount=data.restaurants.reduce((total,item)=>total+item.products.reduce((sum,product)=>sum+(product.recommendations?.length??0),0),0);
console.log(`${apply?"Seed aplicado":"Verificación correcta"}: ${rows.length} restaurante demo, ${categoryCount} categorías, ${productCount} productos y ${recommendationCount} recomendaciones.`);
