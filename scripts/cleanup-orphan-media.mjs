import dotenv from "dotenv";
import {createClient} from "@supabase/supabase-js";

dotenv.config({path:".env.local",quiet:true});
const apply=process.argv.includes("--apply");
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw new Error("Faltan las credenciales seguras de Supabase.");
const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const bucket=admin.storage.from("restaurant-media");

async function listAll(prefix){
  const items=[];
  for(let offset=0;;offset+=100){
    const {data,error}=await bucket.list(prefix,{limit:100,offset,sortBy:{column:"name",order:"asc"}});
    if(error)throw error;
    items.push(...(data??[]));
    if((data??[]).length<100)break;
  }
  return items;
}

async function collectFiles(prefix){
  const files=[];
  for(const item of await listAll(prefix)){
    const path=`${prefix}/${item.name}`;
    if(item.id)files.push({path,bytes:Number(item.metadata?.size??0)});
    else files.push(...await collectFiles(path));
  }
  return files;
}

function logoPath(urlValue){
  if(!urlValue)return null;
  try{const marker="/storage/v1/object/public/restaurant-media/";const pathname=new URL(urlValue).pathname;const index=pathname.indexOf(marker);return index<0?null:decodeURIComponent(pathname.slice(index+marker.length))}catch{return null}
}

const root=await listAll("restaurants");
const restaurantFolders=root.filter(item=>!item.id&&/^[0-9a-f-]{36}$/i.test(item.name)).map(item=>item.name);
const [{data:restaurants,error:restaurantError},{data:products,error:productError}]=await Promise.all([admin.from("restaurants").select("logo_url"),admin.from("products").select("video_path,image_path")]);
if(restaurantError||productError)throw restaurantError??productError;
const referenced=new Set([
  ...(restaurants??[]).map(item=>logoPath(item.logo_url)),
  ...(products??[]).flatMap(item=>[item.video_path,item.image_path]),
].filter(Boolean));
const allFiles=(await Promise.all(restaurantFolders.map(id=>collectFiles(`restaurants/${id}`)))).flat();
const orphanFiles=allFiles.filter(file=>!referenced.has(file.path));
const bytes=orphanFiles.reduce((total,file)=>total+file.bytes,0);
console.log(`${orphanFiles.length} archivos sin referencia · ${(bytes/1024/1024).toFixed(2)} MB`);
if(!apply){console.log("Simulación: añade --apply para eliminarlos.");process.exit(0)}
for(let index=0;index<orphanFiles.length;index+=100){
  const {error:removeError}=await bucket.remove(orphanFiles.slice(index,index+100).map(file=>file.path));
  if(removeError)throw removeError;
}
console.log("Archivos huérfanos eliminados.");
