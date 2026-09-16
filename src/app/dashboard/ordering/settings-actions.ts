"use server";
import {revalidatePath} from "next/cache";
import {activeRestaurant} from "@/lib/permissions";
import {orderSettingsSchema} from "@/lib/order-settings";
export async function saveOrderSettings(form:FormData){
  const {restaurant,member,supabase}=await activeRestaurant();
  if(!['owner','admin','editor'].includes(member.role))throw new Error("No puedes cambiar esta configuración.");
  const value=orderSettingsSchema.parse({customer_order_mode:form.get('customer_order_mode'),payment_timing:form.get('payment_timing'),customer_orders_paused:form.get('customer_orders_paused')==='on',opening_hours:JSON.parse(String(form.get('opening_hours'))),timezone:form.get('timezone')});
  if(value.customer_order_mode==='table_orders'&&(!restaurant.ordering_enabled||!['active','trialing'].includes(restaurant.subscription_status)))throw new Error("Activa Menuly Comandas para recibir pedidos.");
  const {error}=await supabase.from('restaurants').update(value).eq('id',restaurant.id);
  if(error)throw new Error("No se pudo guardar la configuración.");
  revalidatePath('/dashboard/order-settings');revalidatePath('/dashboard/tables');revalidatePath(`/r/${restaurant.slug}`);
}
