import {createClient} from "@supabase/supabase-js";
import {config} from "dotenv";
import {describe,expect,it} from "vitest";
import {purgeExpiredRestaurantTrash} from "../../src/lib/trash-cleanup";

config({path:".env.local",quiet:true});
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const serviceKey=process.env.SUPABASE_SECRET_KEY??process.env.SUPABASE_SERVICE_ROLE_KEY;const suite=url&&serviceKey?describe:describe.skip;

suite("scheduled trash cleanup",()=>{
  it("redacts one isolated expired backup idempotently",async()=>{
    const admin=createClient(url!,serviceKey!,{auth:{persistSession:false,autoRefreshToken:false}});let auditId="";
    try{
      const inserted=await admin.from("superadmin_audit_log").insert({actor_user_id:null,restaurant_id:null,action:"restaurant.deletion_backup_created",created_at:"2025-11-01T00:00:00.000Z",details:{deleted_at:"2025-11-01T00:00:00.000Z",restore_until:"2025-12-01T00:00:00.000Z",restaurant_name:"Expired integration fixture",slug:"expired-integration-fixture",backup:{format:"carta-video.deleted-restaurant",version:2,restaurant:{id:crypto.randomUUID()},media_paths:[]}}}).select("id").single();if(inserted.error)throw inserted.error;auditId=inserted.data.id;
      const first=await purgeExpiredRestaurantTrash(admin,new Date("2026-01-01T00:00:00.000Z"));expect(first.processed).toBeGreaterThanOrEqual(1);
      const redacted=await admin.from("superadmin_audit_log").select("details").eq("id",auditId).single();expect((redacted.data?.details as {backup?:unknown}).backup).toBeUndefined();
      const second=await purgeExpiredRestaurantTrash(admin,new Date("2026-01-01T00:00:00.000Z"));expect(second.processed).toBe(0);
    }finally{
      if(auditId){await admin.from("superadmin_audit_log").delete().eq("action","restaurant.trash_purged").contains("details",{deletion_audit_id:auditId});await admin.from("superadmin_audit_log").delete().eq("id",auditId)}
    }
  });
});
