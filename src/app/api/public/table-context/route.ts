import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {z} from "zod";
import {getSupabaseSecretKey} from "@/lib/supabase/admin-env";
export const dynamic="force-dynamic";
export async function GET(request:Request){
  const code=new URL(request.url).searchParams.get('table');
  if(!z.string().uuid().safeParse(code).success)return NextResponse.json({error:'Mesa no válida'},{status:400});
  const key=getSupabaseSecretKey();if(!key)return NextResponse.json({error:'No disponible'},{status:503});
  const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const{data,error}=await admin.rpc('table_ordering_context',{target_code:code});
  if(error||!data)return NextResponse.json({error:'Mesa no disponible'},{status:404});
  return NextResponse.json({context:{active:data.active,enabled:data.enabled,paymentTiming:data.paymentTiming,expiresAt:data.expiresAt}},{headers:{'Cache-Control':'no-store'}});
}
