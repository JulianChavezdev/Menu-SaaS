"use server";

import {revalidatePath} from "next/cache";
import {z} from "zod";
import {activeRestaurant} from "@/lib/permissions";
import {canTransitionOrder,orderStatusSchema,sessionExpiresAt} from "@/lib/table-ordering";

const uuid=z.string().uuid();
const tableName=z.string().trim().min(1).max(40);

async function orderingRestaurant(){
  const context=await activeRestaurant();
  if(!context.restaurant.ordering_enabled||!["active","trialing"].includes(context.restaurant.subscription_status))throw new Error("Menuly Pedidos no está activo para este restaurante.");
  return context;
}

function refresh(){revalidatePath("/dashboard/tables");revalidatePath("/dashboard/kitchen")}

export async function createDiningTable(form:FormData){
  const parsed=tableName.safeParse(form.get("name"));if(!parsed.success)throw new Error("Escribe un nombre de mesa válido.");
  const{supabase,restaurant}=await orderingRestaurant();
  const{count}=await supabase.from("restaurant_tables").select("id",{count:"exact",head:true}).eq("restaurant_id",restaurant.id);
  if((count??0)>=100)throw new Error("Has alcanzado el máximo de 100 mesas.");
  const{error}=await supabase.from("restaurant_tables").insert({restaurant_id:restaurant.id,name:parsed.data,sort_order:count??0});
  if(error)throw new Error(error.code==="23505"?"Ya existe una mesa con ese nombre.":error.message);refresh();
}

export async function setDiningTableActive(form:FormData){
  const parsed=uuid.safeParse(form.get("table_id"));if(!parsed.success)throw new Error("Mesa no válida.");
  const{supabase,restaurant}=await orderingRestaurant();const active=form.get("active")==="true";
  if(!active)await supabase.from("table_sessions").update({status:"closed",closed_at:new Date().toISOString()}).eq("table_id",parsed.data).eq("restaurant_id",restaurant.id).eq("status","open");
  const{error}=await supabase.from("restaurant_tables").update({is_active:active}).eq("id",parsed.data).eq("restaurant_id",restaurant.id);if(error)throw new Error(error.message);refresh();
}

export async function rotateDiningTableCode(form:FormData){
  const table=uuid.safeParse(form.get("table_id"));const confirmation=String(form.get("confirmation")??"").trim().toUpperCase();
  if(!table.success||confirmation!=="RENOVAR")throw new Error("Escribe RENOVAR para regenerar el QR.");
  const{supabase,restaurant}=await orderingRestaurant();
  const{error}=await supabase.from("restaurant_tables").update({public_code:crypto.randomUUID()}).eq("id",table.data).eq("restaurant_id",restaurant.id);if(error)throw new Error(error.message);refresh();
}

export async function openTableSession(form:FormData){
  const parsed=uuid.safeParse(form.get("table_id"));if(!parsed.success)throw new Error("Mesa no válida.");
  const{supabase,restaurant,user}=await orderingRestaurant();
  const{data:table}=await supabase.from("restaurant_tables").select("id,is_active").eq("id",parsed.data).eq("restaurant_id",restaurant.id).maybeSingle();if(!table?.is_active)throw new Error("La mesa está desactivada.");
  const now=new Date();await supabase.from("table_sessions").update({status:"closed",closed_at:now.toISOString()}).eq("table_id",table.id).eq("restaurant_id",restaurant.id).eq("status","open");
  const{error}=await supabase.from("table_sessions").insert({restaurant_id:restaurant.id,table_id:table.id,started_at:now.toISOString(),expires_at:sessionExpiresAt(now).toISOString(),created_by:user.id});if(error)throw new Error(error.message);refresh();
}

export async function closeTableSession(form:FormData){
  const parsed=uuid.safeParse(form.get("session_id"));if(!parsed.success)throw new Error("Sesión no válida.");
  const{supabase,restaurant}=await orderingRestaurant();const now=new Date().toISOString();
  const{error}=await supabase.from("table_sessions").update({status:"closed",closed_at:now}).eq("id",parsed.data).eq("restaurant_id",restaurant.id).eq("status","open");if(error)throw new Error(error.message);refresh();
}

export async function extendTableSession(form:FormData){
  const parsed=uuid.safeParse(form.get("session_id"));if(!parsed.success)throw new Error("Sesión no válida.");
  const{supabase,restaurant}=await orderingRestaurant();
  const{data:session,error:readError}=await supabase.from("table_sessions").select("expires_at").eq("id",parsed.data).eq("restaurant_id",restaurant.id).eq("status","open").maybeSingle();
  if(readError||!session)throw new Error("La sesión ya no está abierta.");
  const base=new Date(Math.max(Date.now(),new Date(session.expires_at).getTime()));
  const{error}=await supabase.from("table_sessions").update({expires_at:sessionExpiresAt(base).toISOString()}).eq("id",parsed.data).eq("restaurant_id",restaurant.id).eq("status","open");if(error)throw new Error(error.message);refresh();
}

export async function transitionDiningOrder(orderId:string,nextStatus:string){
  const order=uuid.safeParse(orderId);const next=orderStatusSchema.safeParse(nextStatus);if(!order.success||!next.success)throw new Error("Pedido no válido.");
  const{supabase,restaurant}=await orderingRestaurant();
  const{data:current,error:readError}=await supabase.from("dining_orders").select("status,table_session_id").eq("id",order.data).eq("restaurant_id",restaurant.id).maybeSingle();if(readError||!current)throw new Error("Pedido no encontrado.");
  const from=orderStatusSchema.parse(current.status);if(!canTransitionOrder(from,next.data))throw new Error("Ese cambio de estado no está permitido.");
  if(next.data==="pending"){
    const{data:session}=await supabase.from("table_sessions").select("status,expires_at").eq("id",current.table_session_id).eq("restaurant_id",restaurant.id).maybeSingle();
    if(!session||session.status!=="open"||new Date(session.expires_at)<=new Date())throw new Error("Abre de nuevo la mesa antes de reabrir este pedido.");
  }
  const now=new Date().toISOString();const timestamps=next.data==="pending"?{accepted_at:null,ready_at:null,delivered_at:null}:next.data==="accepted"?{accepted_at:now}:next.data==="ready"?{ready_at:now}:next.data==="delivered"?{delivered_at:now}:{};
  const{data:updated,error}=await supabase.from("dining_orders").update({status:next.data,...timestamps}).eq("id",order.data).eq("restaurant_id",restaurant.id).eq("status",from).select("id").maybeSingle();if(error||!updated)throw new Error("El pedido ya cambió de estado. Actualiza la pantalla.");
  if(next.data==="accepted")await supabase.from("table_sessions").update({expires_at:sessionExpiresAt().toISOString()}).eq("id",current.table_session_id).eq("status","open");
  refresh();
}
