import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {analyticsEventSchema} from "@/lib/analytics";
import {getSupabaseSecretKey} from "@/lib/supabase/admin-env";

export async function POST(request:Request){
  const origin=request.headers.get("origin");
  if(origin&&new URL(origin).origin!==new URL(request.url).origin)return NextResponse.json({error:"Invalid origin"},{status:403});
  const text=await request.text();
  if(text.length>2048)return NextResponse.json({error:"Payload too large"},{status:413});
  let body:unknown;try{body=JSON.parse(text)}catch{return NextResponse.json({error:"Invalid JSON"},{status:400})}
  const parsed=analyticsEventSchema.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:"Invalid event"},{status:400});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=getSupabaseSecretKey();
  if(!url||!key)return NextResponse.json({error:"Analytics unavailable"},{status:503});
  const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {error}=await admin.rpc("record_menu_analytics_event",{target_restaurant:parsed.data.restaurantId,target_product:parsed.data.productId??null,target_event:parsed.data.event,target_locale:parsed.data.locale});
  if(error)return NextResponse.json({error:"Event rejected"},{status:error.code==="42501"?403:500});
  return new NextResponse(null,{status:202,headers:{"Cache-Control":"no-store"}});
}
