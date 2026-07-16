import {NextResponse} from "next/server";
import {z} from "zod";
import {createClient} from "@/lib/supabase/server";
import {CLOUDINARY_VIDEO_TRANSFORMATION,configuredCloudinary} from "@/lib/cloudinary";

const input=z.object({restaurantId:z.string().uuid(),productId:z.string().uuid()});
const headers={"Cache-Control":"no-store"};

export async function POST(request:Request){
  const origin=request.headers.get("origin");if(origin&&new URL(origin).origin!==new URL(request.url).origin)return NextResponse.json({error:"Origen no válido"},{status:403,headers});
  const config=configuredCloudinary();if(!config)return NextResponse.json({error:"Cloudinary no configurado",configured:false},{status:503,headers});
  let body:unknown;try{body=await request.json()}catch{return NextResponse.json({error:"Solicitud no válida"},{status:400,headers})}
  const parsed=input.safeParse(body);if(!parsed.success)return NextResponse.json({error:"Datos no válidos"},{status:400,headers});
  const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Sesión caducada"},{status:401,headers});
  const{data:member}=await supabase.from("restaurant_members").select("role,restaurants(access_suspended)").eq("restaurant_id",parsed.data.restaurantId).eq("user_id",user.id).maybeSingle();
  const restaurant=member?.restaurants as unknown as {access_suspended?:boolean}|null;if(!member||restaurant?.access_suspended)return NextResponse.json({error:"Sin permiso"},{status:403,headers});
  const{data:product}=await supabase.from("products").select("id").eq("id",parsed.data.productId).eq("restaurant_id",parsed.data.restaurantId).maybeSingle();if(!product)return NextResponse.json({error:"Producto no encontrado"},{status:404,headers});
  const timestamp=Math.floor(Date.now()/1000);const folder=`carta-video/${parsed.data.restaurantId}/products/${parsed.data.productId}`;const publicId=crypto.randomUUID();const params={timestamp,folder,public_id:publicId,eager:CLOUDINARY_VIDEO_TRANSFORMATION};
  return NextResponse.json({cloudName:config.cloudName,apiKey:config.apiKey,signature:config.client.utils.api_sign_request(params,config.apiSecret),...params,expectedPublicId:`${folder}/${publicId}`},{headers});
}
