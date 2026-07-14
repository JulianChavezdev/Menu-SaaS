import {createClient} from "@supabase/supabase-js";
import {isValidCronAuthorization} from "@/lib/cron-auth";
import {getSupabaseSecretKey} from "@/lib/supabase/admin-env";
import {purgeExpiredRestaurantTrash} from "@/lib/trash-cleanup";

export const dynamic="force-dynamic";
export const maxDuration=60;

export async function GET(request:Request){
  if(!isValidCronAuthorization(request.headers.get("authorization"),process.env.CRON_SECRET))return Response.json({ok:false,error:"Unauthorized"},{status:401});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=getSupabaseSecretKey();
  if(!url||!key)return Response.json({ok:false,error:"Service unavailable"},{status:503});
  try{const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const result=await purgeExpiredRestaurantTrash(admin);return Response.json({ok:true,...result})}catch(error){console.error("trash_cleanup_failed",error instanceof Error?error.message:"unknown");return Response.json({ok:false,error:"Cleanup failed"},{status:500})}
}
