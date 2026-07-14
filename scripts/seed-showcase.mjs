import dotenv from "dotenv";
import {readFile} from "node:fs/promises";
import {createClient} from "@supabase/supabase-js";

dotenv.config({path:".env.local",quiet:true});

const apply=process.argv.includes("--apply");
const data=JSON.parse(await readFile(new URL("../supabase/showcase-data.json",import.meta.url),"utf8"));
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const publicKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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

async function seed(ownerId){
  await inspect(ownerId);
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
    await admin.from("products").insert(products).throwOnError();
  }
}

const owner=await findOwner();
if(apply)await seed(owner.id);
const rows=await inspect(owner.id);
const expected=new Map(data.restaurants.map(item=>[item.slug,item]));
let complete=rows.length===expected.size&&rows.every(row=>expected.get(row.slug)?.template===row.menu_template&&row.is_published&&row.categories?.[0]?.count===3&&row.products?.[0]?.count===3);
for(const row of rows){
  const {data:products,error}=await anonymous.from("products").select("name,restaurant_id").eq("restaurant_id",row.id).order("sort_order");
  if(error)throw error;
  const expectedNames=expected.get(row.slug)?.products.map(product=>product.name)??[];
  if(products?.some(product=>product.restaurant_id!==row.id)||JSON.stringify(products?.map(product=>product.name))!==JSON.stringify(expectedNames))complete=false;
}
console.table(rows.map(row=>({slug:row.slug,template:row.menu_template,categories:row.categories?.[0]?.count??0,products:row.products?.[0]?.count??0,published:row.is_published})));
if(!complete)throw new Error(apply?"El escaparate no quedó completo.":"El escaparate todavía no está sembrado. Ejecuta npm run seed:showcase.");
console.log(`${apply?"Seed aplicado":"Verificación correcta"}: 5 restaurantes aislados, 15 categorías y 15 productos.`);
