import {BackButton} from "@/components/ui/back-button";
import {KitchenBoard,type KitchenOrder} from "@/components/dashboard/kitchen-board";
import {activeRestaurant} from "@/lib/permissions";
import type {OrderStatus} from "@/lib/table-ordering";

type OrderRow={id:string;status:string;subtotal_cents:number;customer_note:string|null;created_at:string;restaurant_tables:{name?:string}|{name?:string}[]|null;dining_order_items:Array<{id:string;product_name:string;quantity:number;note:string|null}>};

export default async function KitchenPage(){
  const{supabase,restaurant}=await activeRestaurant();
  if(!restaurant.ordering_enabled)return <main className="mx-auto max-w-3xl p-6"><BackButton fallback="/dashboard"/><section className="mt-6 border border-stone-200 bg-white p-8 text-center"><h1 className="text-2xl font-bold">Menuly Pedidos no está activo</h1><p className="mt-2 text-sm text-slate-600">Activa el plan de pedidos para utilizar la pantalla de cocina.</p></section></main>;
  const{data,error}=await supabase.from("dining_orders").select("id,status,subtotal_cents,customer_note,created_at,restaurant_tables(name),dining_order_items(id,product_name,quantity,note)").eq("restaurant_id",restaurant.id).in("status",["pending","accepted","preparing","ready"]).order("created_at",{ascending:true});if(error)throw new Error(error.message);
  const orders=((data??[]) as OrderRow[]).map(row=>{const table=Array.isArray(row.restaurant_tables)?row.restaurant_tables[0]:row.restaurant_tables;return({id:row.id,number:row.id.slice(0,6).toUpperCase(),status:row.status as OrderStatus,subtotalCents:row.subtotal_cents,customerNote:row.customer_note,createdAt:row.created_at,tableName:table?.name??"Mesa",items:(row.dining_order_items??[]).map(item=>({id:item.id,name:item.product_name,quantity:item.quantity,note:item.note}))} satisfies KitchenOrder)});
  return <main className="mx-auto max-w-[1600px] p-4 md:p-6"><BackButton fallback="/dashboard"/><div className="mt-5"><KitchenBoard restaurantId={restaurant.id} currency={restaurant.currency} initialOrders={orders}/></div></main>;
}
