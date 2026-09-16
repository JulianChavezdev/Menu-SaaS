import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {z} from "zod";
import {getSupabaseSecretKey} from "@/lib/supabase/admin-env";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
function database(){const key=getSupabaseSecretKey();const url=process.env.NEXT_PUBLIC_SUPABASE_URL;return key&&url?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null}
export async function GET(request:Request){
  const token=new URL(request.url).searchParams.get("token");if(!z.string().uuid().safeParse(token).success)return reply({error:"Seguimiento no válido"},400);
  const admin=database();if(!admin)return reply({error:"Seguimiento no disponible"},503);
  const{data,error}=await admin.from("dining_orders").select("status,payment_status,created_at").eq("public_token",token!).eq("fulfillment","pickup").maybeSingle();
  return error||!data?reply({error:"Pedido no encontrado"},404):reply({order:{status:data.status,paymentStatus:data.payment_status,createdAt:data.created_at}});
}
export async function POST(){return reply({error:"Para pedir, escanea el QR de tu mesa dentro del horario del restaurante."},410)}
