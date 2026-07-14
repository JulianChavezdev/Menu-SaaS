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
  const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const startedAt=Date.now();
  try{
    const result=await purgeExpiredRestaurantTrash(admin);
    const {error:auditError}=await admin.from("superadmin_audit_log").insert({actor_user_id:null,restaurant_id:null,action:"platform.trash_cleanup_completed",details:{...result,duration_ms:Date.now()-startedAt}});
    if(auditError)console.error("trash_cleanup_audit_failed",auditError.message);
    return Response.json({ok:true,...result});
  }catch(error){
    console.error("trash_cleanup_failed",error instanceof Error?error.message:"unknown");
    await admin.from("superadmin_audit_log").insert({actor_user_id:null,restaurant_id:null,action:"platform.trash_cleanup_failed",details:{duration_ms:Date.now()-startedAt,error:"cleanup_failed"}});
    return Response.json({ok:false,error:"Cleanup failed"},{status:500});
  }
}
