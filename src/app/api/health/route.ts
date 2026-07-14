import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {getSupabasePublicKey,getSupabaseUrl} from "@/lib/supabase/env";

export const dynamic="force-dynamic";
const DATABASE_TIMEOUT_MS=3_000;

export async function GET(){
  const url=getSupabaseUrl();
  const key=getSupabasePublicKey();
  const checks={environment:Boolean(url&&key&&process.env.NEXT_PUBLIC_APP_URL),database:false};

  if(url&&key){
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),DATABASE_TIMEOUT_MS);
    try{
      const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
      const {error}=await supabase.from("restaurants").select("id",{head:true}).limit(1).abortSignal(controller.signal);
      checks.database=!error;
    }catch{
      checks.database=false;
    }finally{
      clearTimeout(timeout);
    }
  }

  const healthy=checks.environment&&checks.database;
  return NextResponse.json(
    {status:healthy?"ok":"degraded",checks,timestamp:new Date().toISOString()},
    {status:healthy?200:503,headers:{"Cache-Control":"no-store"}},
  );
}
