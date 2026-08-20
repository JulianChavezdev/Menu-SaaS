import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {getSupabaseSecretKey} from "@/lib/supabase/admin-env";
import {publicOrderSchema} from "@/lib/table-ordering";

const headers={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers});

export async function GET(request:Request){
  const query=new URL(request.url).searchParams;const token=query.get("token");const tableCode=query.get("table");
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if(!token?.match(uuid)||!tableCode?.match(uuid))return reply({error:"Seguimiento no válido."},400);
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=getSupabaseSecretKey();if(!url||!key)return reply({error:"Seguimiento temporalmente no disponible."},503);
  const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const{data,error}=await admin.from("dining_orders").select("status,created_at,accepted_at,ready_at,delivered_at,restaurant_tables!inner(name,public_code)").eq("public_token",token).eq("restaurant_tables.public_code",tableCode).maybeSingle();
  if(error||!data)return reply({error:"Pedido no encontrado."},404);
  return reply({order:{status:data.status,createdAt:data.created_at,acceptedAt:data.accepted_at,readyAt:data.ready_at,deliveredAt:data.delivered_at}});
}

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
  const{data:existing}=await admin.from("dining_orders").select("id,public_token,status,created_at").eq("table_session_id",session.id).eq("client_request_id",parsed.data.requestId).maybeSingle();
  if(existing)return reply({ok:true,replayed:true,order:{number:existing.id.slice(0,6).toUpperCase(),token:existing.public_token,status:existing.status,createdAt:existing.created_at},table:{name:table.name}});
  const minuteAgo=new Date(now.getTime()-60_000).toISOString();
  const{count:recent}=await admin.from("dining_orders").select("id",{count:"exact",head:true}).eq("table_session_id",session.id).gte("created_at",minuteAgo);
  if((recent??0)>=5)return reply({error:"Se han enviado demasiados pedidos seguidos. Espera un minuto."},429);
  const ids=parsed.data.lines.map(line=>line.productId);
  const{data:products,error:productError}=await admin.from("products").select("id,name,price_cents,is_available,categories!inner(is_active)").eq("restaurant_id",restaurant.id).in("id",ids).eq("is_available",true).eq("categories.is_active",true);
  if(productError||products?.length!==ids.length)return reply({error:"Algún producto ya no está disponible. Actualiza la carta."},409);
  const byId=new Map(products.map(product=>[product.id,product]));
  const items=parsed.data.lines.map(line=>{const product=byId.get(line.productId)!;return{restaurant_id:restaurant.id,product_id:product.id,product_name:product.name,unit_price_cents:product.price_cents,quantity:line.quantity,note:line.note||null,line_total_cents:product.price_cents*line.quantity}});
  const subtotal=items.reduce((sum,item)=>sum+item.line_total_cents,0);
  const{data:created,error:orderError}=await admin.rpc("create_public_dining_order",{target_restaurant:restaurant.id,target_table:table.id,target_session:session.id,target_request:parsed.data.requestId,target_subtotal:subtotal,target_customer_note:parsed.data.customerNote,target_items:items});
  const order=Array.isArray(created)?created[0]:created;
  if(orderError||!order)return reply({error:"No se pudo registrar el pedido."},503);
  return reply({ok:true,replayed:Boolean(order.replayed),order:{number:order.order_id.slice(0,6).toUpperCase(),token:order.order_public_token,status:order.order_status,createdAt:order.order_created_at},table:{name:table.name}},order.replayed?200:201);
}
