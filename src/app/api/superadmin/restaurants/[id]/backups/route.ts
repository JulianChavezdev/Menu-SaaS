import {NextResponse} from "next/server";
import {superadminApiContext} from "@/lib/superadmin-api";

export const dynamic="force-dynamic";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const headers={"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"};
const response=(body:unknown,status=200)=>NextResponse.json(body,{status,headers});

export async function POST(_request:Request,{params}:{params:Promise<{id:string}>}){
  const context=await superadminApiContext();
  if(context.status!==200)return response({error:context.status===401?"Authentication required":context.status===403?"Forbidden":"Backup unavailable"},context.status);
  const {id}=await params;
  if(!UUID.test(id))return response({error:"Restaurante no válido."},400);
  const {admin,user}=context;
  const {data,error}=await admin.rpc("create_restaurant_backup",{target_restaurant:id,backup_reason:"manual",actor_user:user.id});
  if(error)return response({error:"No se pudo crear el punto de restauración."},409);
  await admin.from("superadmin_audit_log").insert({actor_user_id:user.id,restaurant_id:id,action:"restaurant.backup_created",details:{backup_id:data,reason:"manual"}});
  return response({created:true,id:data},201);
}
