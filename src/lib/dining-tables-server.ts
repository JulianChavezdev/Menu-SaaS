import {createClient} from "@supabase/supabase-js";
import {getSupabaseSecretKey} from "./supabase/admin-env";
import {activeRestaurant} from "./permissions";
export async function loadDiningTables(){
  const context=await activeRestaurant();const{restaurant,member}=context;
  if(!['owner','admin','editor','waiter','kitchen'].includes(member.role))throw new Error('Sin acceso a mesas');
  const key=getSupabaseSecretKey();if(!key)throw new Error('Mesas no disponibles');
  const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const[tableResult,windowResult]=await Promise.all([admin.from('restaurant_tables').select('id,name,public_code,is_active,orders_paused_until').eq('restaurant_id',restaurant.id).order('sort_order').order('created_at'),admin.rpc('restaurant_ordering_window',{target_restaurant:restaurant.id})]);
  if(tableResult.error||windowResult.error)throw new Error('No se pudieron cargar las mesas');
  const window=windowResult.data?.[0];
  return{...context,tables:tableResult.data??[],closesAt:window?.closes_at??null,opensAt:window?.opens_at??null};
}
