import {createClient} from "@supabase/supabase-js";
import {getSupabaseSecretKey} from "./supabase/admin-env";
import {kitchenOrderSelect,mapKitchenOrders,type KitchenOrderRow} from "./kitchen-orders";
export async function loadPickupOrders(restaurantId:string){
  const key=getSupabaseSecretKey();if(!key)throw new Error("Caja no disponible");
  const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const{data,error}=await admin.from("dining_orders").select(kitchenOrderSelect).eq("restaurant_id",restaurantId).eq("fulfillment","pickup").or(`status.in.(pending,accepted,preparing,ready),created_at.gte.${new Date(Date.now()-24*60*60*1000).toISOString()}`).order("created_at",{ascending:false}).limit(200);
  if(error)throw new Error("No se pudieron cargar los pedidos");return mapKitchenOrders((data??[]) as KitchenOrderRow[]);
}
