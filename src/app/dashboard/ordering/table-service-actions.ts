"use server";
import {z} from "zod";
import {createClient} from "@supabase/supabase-js";
import {revalidatePath} from "next/cache";
import {getSupabaseSecretKey} from "@/lib/supabase/admin-env";
import {activeRestaurant} from "@/lib/permissions";
export async function setTableService(tableId:string,paused:boolean){
  z.string().uuid().parse(tableId);z.boolean().parse(paused);const{restaurant,member}=await activeRestaurant();
  if(!['owner','admin','editor','waiter','kitchen'].includes(member.role))throw new Error('No tienes acceso a mesas');
  const key=getSupabaseSecretKey();if(!key)throw new Error('Mesas no disponibles');
  const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const{data:window,error:windowError}=await admin.rpc('restaurant_ordering_window',{target_restaurant:restaurant.id});
  if(windowError||(paused&&!window?.[0]?.closes_at))throw new Error('El restaurante está fuera del horario de pedidos');
  const{data,error}=await admin.from('restaurant_tables').update({orders_paused_until:paused?window[0].closes_at:null}).eq('id',tableId).eq('restaurant_id',restaurant.id).select('id').maybeSingle();
  if(error||!data)throw new Error('No se pudo actualizar la mesa');
  revalidatePath('/dashboard/tables');revalidatePath('/operaciones/mesas');revalidatePath(`/r/${restaurant.slug}`);
}
