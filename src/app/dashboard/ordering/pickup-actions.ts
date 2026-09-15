"use server";
import {createClient} from "@supabase/supabase-js";
import {revalidatePath} from "next/cache";
import {z} from "zod";
import {activeRestaurant} from "@/lib/permissions";
import {canUseWaiter} from "@/lib/member-roles";
import {getSupabaseSecretKey} from "@/lib/supabase/admin-env";
export async function savePickupSettings(form:FormData){
  const{restaurant,supabase,member}=await activeRestaurant();
  if(!["owner","admin","editor"].includes(member.role)||!restaurant.ordering_enabled)throw new Error("No tienes permisos para configurar pedidos");
  const{error}=await supabase.from("restaurants").update({pickup_enabled:form.get("enabled")==="on",pickup_paused:form.get("paused")==="on"}).eq("id",restaurant.id);
  if(error)throw new Error("No se pudo guardar la configuración");
  revalidatePath("/dashboard/pickup");revalidatePath(`/r/${restaurant.slug}`);
}
export async function confirmPickupPayment(orderId:string){
  const id=z.string().uuid().parse(orderId);const{restaurant,member,user}=await activeRestaurant();
  if(!canUseWaiter(member.role)||!restaurant.ordering_enabled||!["active","trialing"].includes(restaurant.subscription_status))throw new Error("No tienes acceso a caja");
  const key=getSupabaseSecretKey();if(!key)throw new Error("Caja no disponible");
  const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const{data,error}=await admin.rpc("complete_pickup_order",{target_restaurant:restaurant.id,target_order:id,target_actor:user.id});
  if(error||!data)throw new Error("El pedido ya cambió de estado. Actualiza la pantalla antes de cobrar.");
  revalidatePath("/operaciones/caja");revalidatePath("/dashboard/orders");
}
