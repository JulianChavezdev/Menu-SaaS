import type {SupabaseClient} from "@supabase/supabase-js";
import {RESTAURANT_RESTORE_WINDOW_MS} from "./restaurant-trash";

type AuditDetails={deleted_at?:unknown;restore_until?:unknown;restaurant_name?:unknown;slug?:unknown;deletion_audit_id?:unknown;backup?:{restaurant?:{id?:unknown};media_paths?:unknown}};

export async function purgeExpiredRestaurantTrash(admin:SupabaseClient,now=new Date()){
  const cutoff=new Date(now.getTime()-RESTAURANT_RESTORE_WINDOW_MS).toISOString();
  const[{data:deletions,error},{data:resolutions,error:resolutionError}]=await Promise.all([
    admin.from("superadmin_audit_log").select("id,details,created_at").eq("action","restaurant.deletion_backup_created").lt("created_at",cutoff).order("created_at",{ascending:true}).limit(100),
    admin.from("superadmin_audit_log").select("action,details").in("action",["restaurant.restored_from_trash","restaurant.trash_purged"]).order("created_at",{ascending:false}).limit(2000),
  ]);
  if(error||resolutionError)throw error??resolutionError;
  const restored=new Set<string>();const purged=new Set<string>();
  for(const event of resolutions??[]){const id=(event.details as AuditDetails)?.deletion_audit_id;if(typeof id!=="string")continue;if(event.action==="restaurant.restored_from_trash")restored.add(id);else purged.add(id)}
  let processed=0;let mediaRemoved=0;let failed=0;
  for(const entry of deletions??[]){
    if(purged.has(entry.id))continue;
    const details=entry.details as AuditDetails;const backup=details?.backup;
    if(!backup)continue;
    const restaurantId=backup.restaurant?.id;
    const prefix=typeof restaurantId==="string"?`restaurants/${restaurantId}/`:"";
    const rawPaths=Array.isArray(backup.media_paths)?backup.media_paths:[];
    const paths=[...new Set(rawPaths.filter((path):path is string=>typeof path==="string"&&Boolean(prefix)&&path.startsWith(prefix)&&!path.split("/").includes("..")))];
    let removed=0;
    if(!restored.has(entry.id)){
      let removalFailed=false;
      for(let index=0;index<paths.length;index+=100){const {error:removeError}=await admin.storage.from("restaurant-media").remove(paths.slice(index,index+100));if(removeError){removalFailed=true;failed++;break}removed+=Math.min(100,paths.length-index)}
      if(removalFailed)continue;
    }
    const redacted={deleted_at:typeof details.deleted_at==="string"?details.deleted_at:entry.created_at,restore_until:typeof details.restore_until==="string"?details.restore_until:cutoff,restaurant_name:typeof details.restaurant_name==="string"?details.restaurant_name:"Restaurante eliminado",slug:typeof details.slug==="string"?details.slug:null,purged_at:now.toISOString(),restored:restored.has(entry.id),media_files_removed:removed};
    const {error:updateError}=await admin.from("superadmin_audit_log").update({details:redacted}).eq("id",entry.id);if(updateError){failed++;continue}
    await admin.from("superadmin_audit_log").insert({actor_user_id:null,restaurant_id:null,action:"restaurant.trash_purged",details:{deletion_audit_id:entry.id,purged_at:now.toISOString(),restored:restored.has(entry.id),media_files_removed:removed}});
    processed++;mediaRemoved+=removed;
  }
  return{processed,mediaRemoved,failed,cutoff};
}
