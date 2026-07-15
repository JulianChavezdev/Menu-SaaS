import type {SupabaseClient} from "@supabase/supabase-js";
import {purgeExpiredRestaurantTrash} from "./trash-cleanup";

function diagnostic(error:unknown){
  if(!error||typeof error!=="object")return{error_code:"unknown"};
  const value=error as {code?:unknown;message?:unknown};
  return{error_code:typeof value.code==="string"?value.code:"unknown",error_message:typeof value.message==="string"?value.message.slice(0,500):"Cleanup failed"};
}

export async function executeTrashCleanup(admin:SupabaseClient,now=new Date()){
  const startedAt=Date.now();
  try{
    const result=await purgeExpiredRestaurantTrash(admin,now);
    await admin.from("superadmin_audit_log").insert({actor_user_id:null,restaurant_id:null,action:"platform.trash_cleanup_completed",details:{...result,duration_ms:Date.now()-startedAt}}).throwOnError();
    return result;
  }catch(error){
    await admin.from("superadmin_audit_log").insert({actor_user_id:null,restaurant_id:null,action:"platform.trash_cleanup_failed",details:{duration_ms:Date.now()-startedAt,...diagnostic(error)}});
    throw error;
  }
}
