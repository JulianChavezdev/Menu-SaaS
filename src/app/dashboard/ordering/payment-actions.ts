"use server";
import {z} from "zod";
import {createClient} from "@supabase/supabase-js";
import {revalidatePath} from "next/cache";
import {activeRestaurant} from "@/lib/permissions";
import {canUseKitchen} from "@/lib/member-roles";
import {getSupabaseSecretKey} from "@/lib/supabase/admin-env";
export async function recordOrderPayment(orderId:string,reference:string){
  z.string().uuid().parse(orderId);z.string().max(80).parse(reference);
  const{restaurant,member,user}=await activeRestaurant();
  if(!canUseKitchen(member.role)||!restaurant.ordering_enabled||!['active','trialing'].includes(restaurant.subscription_status))throw new Error('No tienes acceso a esta operación');
  const key=getSupabaseSecretKey();if(!key)throw new Error('Servicio no disponible');
  const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const{data,error}=await admin.rpc('record_order_payment',{target_restaurant:restaurant.id,target_order:orderId,target_actor:user.id,target_reference:reference});
  if(error||!data)throw new Error('El pedido ya cambió. Actualiza antes de registrar el cobro.');
  revalidatePath('/operaciones/cocina');revalidatePath('/dashboard/orders');
}
