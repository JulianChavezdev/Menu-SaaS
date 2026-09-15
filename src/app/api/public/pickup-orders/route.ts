import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {createHmac} from "node:crypto";
import {z} from "zod";
import {getSupabaseSecretKey} from "@/lib/supabase/admin-env";
import {pickupOrderSchema,priceOrderLines} from "@/lib/pickup-orders";
import {isMenuPublic} from "@/lib/public-menu";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
function database(){const key=getSupabaseSecretKey();const url=process.env.NEXT_PUBLIC_SUPABASE_URL;return key&&url?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null}
export async function GET(request:Request){
  const token=new URL(request.url).searchParams.get("token");if(!z.string().uuid().safeParse(token).success)return reply({error:"Seguimiento no válido"},400);
  const admin=database();if(!admin)return reply({error:"Seguimiento no disponible"},503);
  const{data,error}=await admin.from("dining_orders").select("status,payment_status,created_at").eq("public_token",token!).eq("fulfillment","pickup").maybeSingle();
  return error||!data?reply({error:"Pedido no encontrado"},404):reply({order:{status:data.status,paymentStatus:data.payment_status,createdAt:data.created_at}});
}
export async function POST(request:Request){
  try{const origin=request.headers.get("origin");if(origin&&new URL(origin).origin!==new URL(request.url).origin)return reply({error:"Origen no válido"},403)}catch{return reply({error:"Origen no válido"},403)}
  const raw=await request.text();if(raw.length>60000)return reply({error:"Pedido demasiado grande"},413);
  let input:unknown;try{input=JSON.parse(raw)}catch{return reply({error:"Pedido no válido"},400)}
  const parsed=pickupOrderSchema.safeParse(input);if(!parsed.success)return reply({error:"Revisa los productos del pedido"},400);
  const admin=database();if(!admin)return reply({error:"Pedidos no disponibles"},503);
  const{restaurantId,requestId,lines,customerNote}=parsed.data;
  // Resolve retries before checking availability: a previously accepted order stays accepted.
  const{data:existing}=await admin.from("dining_orders").select("id,public_token,status,created_at").eq("restaurant_id",restaurantId).eq("fulfillment","pickup").eq("client_request_id",requestId).maybeSingle();
  if(existing)return reply({order:{number:existing.id.slice(0,8).toUpperCase(),token:existing.public_token,status:existing.status},replayed:true});
  const{data:restaurant}=await admin.from("restaurants").select("is_published,access_suspended,publication_suspended_for_payment,subscription_status,ordering_enabled,pickup_enabled,pickup_paused").eq("id",restaurantId).maybeSingle();
  if(!restaurant||!isMenuPublic(restaurant)||!restaurant.ordering_enabled||!restaurant.pickup_enabled||restaurant.pickup_paused)return reply({error:"El restaurante no acepta pedidos para recoger en este momento"},409);
  const ids=[...new Set(lines.map(l=>l.productId))];
  const{data:products,error}=await admin.from("products").select("id,name,price_cents,customization,updated_at,categories!inner(is_active)").eq("restaurant_id",restaurantId).in("id",ids).eq("is_available",true).eq("categories.is_active",true);
  if(error||products?.length!==ids.length)return reply({error:"Algún producto ya no está disponible. Actualiza la carta."},409);
  let items;try{items=priceOrderLines(lines,products,restaurantId)}catch(error){return reply({error:error instanceof Error?error.message:"Revisa la personalización"},409)}
  const ip=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()??"unknown";
  const clientHash=createHmac("sha256",getSupabaseSecretKey()!).update(`${restaurantId}:${new Date().toISOString().slice(0,10)}:${ip}:${parsed.data.clientId}`).digest("hex");
  const{data:created,error:orderError}=await admin.rpc("create_pickup_order",{target_restaurant:restaurantId,target_request:requestId,target_customer_note:customerNote,target_items:items,target_client_hash:clientHash});
  if(orderError)return reply({error:orderError.message.includes("rate_limit")?"Demasiados pedidos seguidos. Espera un minuto.":"No se pudo aceptar el pedido. Actualiza la carta y revisa la disponibilidad."},orderError.message.includes("rate_limit")?429:409);
  const order=Array.isArray(created)?created[0]:created;if(!order)return reply({error:"No se pudo registrar el pedido"},503);
  return reply({order:{number:order.order_id.slice(0,8).toUpperCase(),token:order.order_public_token,status:order.order_status},replayed:order.replayed},order.replayed?200:201);
}
