import {revalidatePath} from "next/cache";
import {NextResponse} from "next/server";
import {buildRestorePreview,MAX_BACKUP_BYTES,parseRestaurantBackup,RestoreValidationError} from "@/lib/restaurant-restore";
import {superadminApiContext} from "@/lib/superadmin-api";

export const dynamic="force-dynamic";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const privateHeaders={"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"};
const response=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:privateHeaders});

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const context=await superadminApiContext();
  if(context.status!==200)return response({error:context.status===401?"Authentication required":context.status===403?"Forbidden":"Restore unavailable"},context.status);
  const {id}=await params;
  if(!UUID.test(id))return response({error:"Restaurante no válido."},400);
  const declaredSize=Number(request.headers.get("content-length")??0);
  if(declaredSize>MAX_BACKUP_BYTES)return response({error:"La copia supera el máximo de 5 MB."},413);
  const raw=await request.text();
  if(new TextEncoder().encode(raw).byteLength>MAX_BACKUP_BYTES)return response({error:"La copia supera el máximo de 5 MB."},413);
  let payload:unknown;
  try{payload=JSON.parse(raw)}catch{return response({error:"El archivo no contiene JSON válido."},400)}
  if(!payload||typeof payload!=="object"||Array.isArray(payload))return response({error:"Solicitud no válida."},400);
  const body=payload as {backup?:unknown;confirmation?:unknown};
  let backup;
  try{backup=parseRestaurantBackup(body.backup,id)}catch(error){return response({error:error instanceof RestoreValidationError?error.message:"Copia no válida."},400)}

  const {admin,user}=context;
  const[{data:restaurant,error},{data:categories,error:categoriesError},{data:products,error:productsError}]=await Promise.all([
    admin.from("restaurants").select("name,slug,description,logo_url,phone,email,address,instagram_url,website_url,currency,locale,timezone,is_published,language_switcher_enabled,menu_template,subscription_status").eq("id",id).maybeSingle(),
    admin.from("categories").select("id").eq("restaurant_id",id),
    admin.from("products").select("id").eq("restaurant_id",id),
  ]);
  if(error||!restaurant)return response({error:"Restaurante no encontrado."},404);
  if(categoriesError||productsError)return response({error:"No se pudo comprobar la carta actual."},503);
  const preview=buildRestorePreview(backup,restaurant,(categories??[]).map(item=>item.id),(products??[]).map(item=>item.id));
  const mode=new URL(request.url).searchParams.get("mode")==="apply"?"apply":"preview";
  if(mode==="preview")return response({preview});
  if(!preview.canApply)return response({error:preview.warnings.at(-1),preview},409);
  if(body.confirmation!==restaurant.slug)return response({error:`Escribe ${restaurant.slug} para confirmar la restauración.`},409);

  const {error:backupError}=await admin.rpc("create_restaurant_backup",{target_restaurant:id,backup_reason:"pre_restore",actor_user:user.id});
  if(backupError)return response({error:"No se pudo crear la copia de seguridad previa. La restauración fue cancelada."},503);
  const restoredRestaurant={...backup.restaurant,source_exported_at:backup.exportedAt};
  const {data,error:restoreError}=await admin.rpc("restore_restaurant_content",{target_restaurant:id,backup_restaurant:restoredRestaurant,backup_categories:backup.categories,backup_products:backup.products,actor_user:user.id});
  if(restoreError)return response({error:"No se pudo aplicar la copia. No se ha modificado ningún dato."},409);
  revalidatePath(`/superadmin/restaurants/${id}`);
  revalidatePath(`/r/${restaurant.slug}`);
  return response({restored:true,result:data});
}
