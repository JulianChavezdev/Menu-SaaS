import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {getSupabaseSecretKey} from "@/lib/supabase/admin-env";
import {publicOrderSchema} from "@/lib/table-ordering";

const headers={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers});

export async function POST(request:Request){
  const origin=request.headers.get("origin");
  if(origin&&new URL(origin).origin!==new URL(request.url).origin)return reply({error:"Origen no válido."},403);
  const text=await request.text();if(text.length>20_000)return reply({error:"Pedido demasiado grande."},413);
  let body:unknown;try{body=JSON.parse(text)}catch{return reply({error:"Pedido no válido."},400)}
  const parsed=publicOrderSchema.safeParse(body);if(!parsed.success)return reply({error:"Revisa los productos del pedido."},400);
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=getSupabaseSecretKey();if(!url||!key)return reply({error:"Pedidos temporalmente no disponibles."},503);
  const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const now=new Date();
  const{data:table,error:tableError}=await admin.from("restaurant_tables").select("id,restaurant_id,name,is_active").eq("public_code",parsed.data.tableCode).maybeSingle();
  if(tableError||!table?.is_active)return reply({error:"El código de esta mesa no está activo."},404);
  const{data:restaurant}=await admin.from("restaurants").select("id,is_published,access_suspended,subscription_status,ordering_enabled").eq("id",table.restaurant_id).maybeSingle();
  if(!restaurant?.is_published||restaurant.access_suspended||restaurant.subscription_status!=="active"||!restaurant.ordering_enabled)return reply({error:"El restaurante no está aceptando pedidos desde la carta."},403);
  const{data:session}=await admin.from("table_sessions").select("id,status,expires_at").eq("table_id",table.id).eq("restaurant_id",restaurant.id).eq("status","open").gt("expires_at",now.toISOString()).order("started_at",{ascending:false}).limit(1).maybeSingle();
  if(!session)return reply({error:"La sesión de esta mesa está cerrada. Pide al personal que la active."},409);
  const minuteAgo=new Date(now.getTime()-60_000).toISOString();
  const{count:recent}=await admin.from("dining_orders").select("id",{count:"exact",head:true}).eq("table_session_id",session.id).gte("created_at",minuteAgo);
  if((recent??0)>=5)return reply({error:"Se han enviado demasiados pedidos seguidos. Espera un minuto."},429);
  const ids=parsed.data.lines.map(line=>line.productId);
  const{data:products,error:productError}=await admin.from("products").select("id,name,price_cents,is_available,categories!inner(is_active)").eq("restaurant_id",restaurant.id).in("id",ids).eq("is_available",true).eq("categories.is_active",true);
  if(productError||products?.length!==ids.length)return reply({error:"Algún producto ya no está disponible. Actualiza la carta."},409);
  const byId=new Map(products.map(product=>[product.id,product]));
  const items=parsed.data.lines.map(line=>{const product=byId.get(line.productId)!;return{restaurant_id:restaurant.id,product_id:product.id,product_name:product.name,unit_price_cents:product.price_cents,quantity:line.quantity,note:line.note||null,line_total_cents:product.price_cents*line.quantity}});
  const subtotal=items.reduce((sum,item)=>sum+item.line_total_cents,0);
  const{data:order,error:orderError}=await admin.from("dining_orders").insert({restaurant_id:restaurant.id,table_id:table.id,table_session_id:session.id,status:"pending",subtotal_cents:subtotal,customer_note:parsed.data.customerNote||null}).select("id,status,created_at").single();
  if(orderError||!order)return reply({error:"No se pudo registrar el pedido."},503);
  const{error:itemError}=await admin.from("dining_order_items").insert(items.map(item=>({...item,order_id:order.id})));
  if(itemError){await admin.from("dining_orders").delete().eq("id",order.id);return reply({error:"No se pudieron guardar los productos."},503)}
  return reply({ok:true,order:{number:order.id.slice(0,6).toUpperCase(),status:order.status,createdAt:order.created_at},table:{name:table.name}},201);
}
