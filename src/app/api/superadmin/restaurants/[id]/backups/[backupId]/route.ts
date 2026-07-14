import {NextResponse} from "next/server";
import {safeExportName} from "@/lib/restaurant-export";
import {superadminApiContext} from "@/lib/superadmin-api";

export const dynamic="force-dynamic";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const privateHeaders={"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"};
const response=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:privateHeaders});

async function recordContext(id:string,backupId:string){
  const context=await superadminApiContext();
  if(context.status!==200)return{error:response({error:context.status===401?"Authentication required":context.status===403?"Forbidden":"Backup unavailable"},context.status)};
  if(!UUID.test(id)||!UUID.test(backupId))return{error:response({error:"Copia no válida."},400)};
  const {data,error}=await context.admin.from("restaurant_backups").select("id,reason,payload,created_at,restaurants(slug)").eq("id",backupId).eq("restaurant_id",id).maybeSingle();
  if(error||!data)return{error:response({error:"Copia no encontrada."},404)};
  return{context,data};
}

export async function GET(request:Request,{params}:{params:Promise<{id:string;backupId:string}>}){
  const {id,backupId}=await params;
  const result=await recordContext(id,backupId);
  if("error" in result)return result.error;
  if(new URL(request.url).searchParams.get("download")!=="1")return response({backup:result.data.payload});
  const relation=result.data.restaurants as unknown as {slug?:string}|null;
  const filename=`${safeExportName(relation?.slug)}-${result.data.reason}-${result.data.created_at.slice(0,10)}.json`;
  return new NextResponse(JSON.stringify(result.data.payload,null,2),{headers:{...privateHeaders,"Content-Type":"application/json; charset=utf-8","Content-Disposition":`attachment; filename="${filename}"`}});
}

export async function DELETE(_request:Request,{params}:{params:Promise<{id:string;backupId:string}>}){
  const {id,backupId}=await params;
  const result=await recordContext(id,backupId);
  if("error" in result)return result.error;
  const {admin,user}=result.context;
  const {error}=await admin.from("restaurant_backups").delete().eq("id",backupId).eq("restaurant_id",id);
  if(error)return response({error:"No se pudo eliminar la copia."},409);
  await admin.from("superadmin_audit_log").insert({actor_user_id:user.id,restaurant_id:id,action:"restaurant.backup_deleted",details:{backup_id:backupId,reason:result.data.reason}});
  return response({deleted:true});
}
