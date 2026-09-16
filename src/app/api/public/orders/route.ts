import {createHmac} from "node:crypto";
import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {getSupabaseSecretKey} from "@/lib/supabase/admin-env";
import {publicOrderSchema} from "@/lib/table-ordering";
import {priceOrderLines} from "@/lib/pickup-orders";

const headers={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers});

export async function GET(request:Request){
  const query=new URL(request.url).searchParams;const token=query.get("token");const tableCode=query.get("table");
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if(!token?.match(uuid)||!tableCode?.match(uuid))return reply({error:"Seguimiento no válido."},400);
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=getSupabaseSecretKey();if(!url||!key)return reply({error:"Seguimiento temporalmente no disponible."},503);
  const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const{data,error}=await admin.from("dining_orders").select("status,payment_status,payment_timing,created_at,accepted_at,ready_at,delivered_at,restaurant_tables!inner(name,public_code)").eq("public_token",token).eq("restaurant_tables.public_code",tableCode).maybeSingle();
  if(error||!data)return reply({error:"Pedido no encontrado."},404);
  return reply({order:{status:data.status,paymentStatus:data.payment_status,paymentTiming:data.payment_timing,createdAt:data.created_at,acceptedAt:data.accepted_at,readyAt:data.ready_at,deliveredAt:data.delivered_at}});
}

export async function POST(request:Request){
  try{const origin=request.headers.get("origin");if(origin&&new URL(origin).origin!==new URL(request.url).origin)return reply({error:"Origen no válido."},403)}catch{return reply({error:"Origen no válido."},403)}
  const raw=await request.text();if(raw.length>60000)return reply({error:"Pedido demasiado grande."},413);
  let body:unknown;try{body=JSON.parse(raw)}catch{return reply({error:"Pedido no válido."},400)}
  const parsed=publicOrderSchema.safeParse(body);if(!parsed.success)return reply({error:"Escanea el QR de tu mesa y revisa el pedido."},400);
  const key=getSupabaseSecretKey(),url=process.env.NEXT_PUBLIC_SUPABASE_URL;if(!key||!url)return reply({error:"Pedidos no disponibles."},503);
  const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const{data:context,error:contextError}=await admin.rpc("table_ordering_context",{target_code:parsed.data.tableCode});
  if(contextError||!context)return reply({error:"Mesa no disponible."},404);
  const{data:existing}=await admin.from("dining_orders").select("id,public_token,status,payment_status,payment_timing").eq("table_id",context.tableId).eq("order_source","table_qr").eq("client_request_id",parsed.data.requestId).maybeSingle();
  if(existing)return reply({order:{number:existing.id.slice(0,8).toUpperCase(),token:existing.public_token,status:existing.status,paymentStatus:existing.payment_status,paymentTiming:existing.payment_timing},replayed:true});
  if(parsed.data.expectedPaymentTiming!==context.paymentTiming)return reply({code:"payment_settings_changed",paymentTiming:context.paymentTiming,error:"Ha cambiado el momento de pago. Actualiza la carta, revisa las condiciones y confirma de nuevo."},409);
  if(!context.active)return reply({error:"Esta mesa no acepta pedidos ahora. Consulta el horario o avisa al personal."},409);
  const ids=[...new Set(parsed.data.lines.map(line=>line.productId))];
  const{data:products,error}=await admin.from("products").select("id,name,price_cents,customization,updated_at,categories!inner(is_active)").eq("restaurant_id",context.restaurantId).in("id",ids).eq("is_available",true).eq("categories.is_active",true);
  if(error||products?.length!==ids.length)return reply({error:"Algún producto ya no está disponible. Actualiza la carta."},409);
  let items;try{items=priceOrderLines(parsed.data.lines,products,context.restaurantId)}catch(error){return reply({error:error instanceof Error?error.message:"Revisa las opciones."},409)}
  const ip=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()??"unknown";
  const clientHash=createHmac("sha256",key).update(context.restaurantId+":"+context.tableId+":"+new Date().toISOString().slice(0,10)+":"+ip).digest("hex");
  const{data:order,error:orderError}=await admin.rpc("create_table_qr_order",{target_table_code:parsed.data.tableCode,target_request:parsed.data.requestId,target_note:parsed.data.customerNote,target_items:items,target_client_hash:clientHash,target_payment_timing:parsed.data.expectedPaymentTiming});
  if(orderError?.message.includes("payment_settings_changed"))return reply({code:"payment_settings_changed",error:"Ha cambiado el momento de pago. Revisa las condiciones y confirma de nuevo."},409);
  if(orderError||!order)return reply({error:orderError?.message.includes("rate_limit")?"Demasiados pedidos seguidos. Espera un minuto.":"No se pudo aceptar el pedido. Revisa el horario y la disponibilidad."},orderError?.message.includes("rate_limit")?429:409);
  return reply({order:{number:order.order_id.slice(0,8).toUpperCase(),token:order.order_public_token,status:order.order_status,paymentStatus:order.payment_status,paymentTiming:order.payment_timing},replayed:order.replayed},order.replayed?200:201);
}
