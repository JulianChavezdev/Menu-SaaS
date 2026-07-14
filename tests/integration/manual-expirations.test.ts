import {createClient} from "@supabase/supabase-js";
import {config} from "dotenv";
import {describe,expect,it} from "vitest";

config({path:".env.local",quiet:true});
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey=process.env.SUPABASE_SECRET_KEY??process.env.SUPABASE_SERVICE_ROLE_KEY;
const suite=url&&serviceKey?describe:describe.skip;

suite("manual expiration lifecycle",()=>{
  it("respects grace, marks pending, suspends explicitly and remains idempotent",async context=>{
    const admin=createClient(url!,serviceKey!,{auth:{persistSession:false,autoRefreshToken:false}});
    const probe=await admin.rpc("process_manual_expirations",{grace_days:-1,suspend_access:false,actor_user:crypto.randomUUID()});
    if(probe.error?.code==="PGRST202"){context.skip();return}
    expect(probe.error?.code).toBe("22023");

    const stamp=`${Date.now()}-${crypto.randomUUID()}`;
    let userId:string|undefined;const restaurantIds:string[]=[];
    try{
      const user=await admin.auth.admin.createUser({email:`manual-expiration-${stamp}@carta-video.local`,password:`Expiration-${crypto.randomUUID()}!`,email_confirm:true});
      if(user.error)throw user.error;userId=user.data.user.id;
      for(const label of ["overdue","grace"]){
        const restaurant=await admin.from("restaurants").insert({owner_id:userId,name:`Expiration ${label}`,slug:`expiration-${label}-${stamp}`,subscription_status:"active"}).select("id").single();
        if(restaurant.error)throw restaurant.error;restaurantIds.push(restaurant.data.id);
      }
      const now=Date.now();
      const subscriptions=await admin.from("subscriptions").insert([
        {restaurant_id:restaurantIds[0],provider:"manual",plan:"carta",status:"active",current_period_end:new Date(now-10*86400000).toISOString()},
        {restaurant_id:restaurantIds[1],provider:"manual",plan:"carta",status:"active",current_period_end:new Date(now-86400000).toISOString()},
      ]);
      if(subscriptions.error)throw subscriptions.error;

      const mark=await admin.rpc("process_manual_expirations",{grace_days:3,suspend_access:false,actor_user:userId});
      if(mark.error)throw mark.error;expect(mark.data).toBe(1);
      const afterMark=await admin.from("restaurants").select("id,subscription_status,access_suspended").in("id",restaurantIds).order("name");
      const overdue=afterMark.data?.find(item=>item.id===restaurantIds[0]);const protectedByGrace=afterMark.data?.find(item=>item.id===restaurantIds[1]);
      expect(overdue).toMatchObject({subscription_status:"past_due",access_suspended:false});
      expect(protectedByGrace).toMatchObject({subscription_status:"active",access_suspended:false});

      const repeatedMark=await admin.rpc("process_manual_expirations",{grace_days:3,suspend_access:false,actor_user:userId});
      if(repeatedMark.error)throw repeatedMark.error;expect(repeatedMark.data).toBe(0);
      const suspend=await admin.rpc("process_manual_expirations",{grace_days:3,suspend_access:true,actor_user:userId});
      if(suspend.error)throw suspend.error;expect(suspend.data).toBe(1);
      const afterSuspend=await admin.from("restaurants").select("subscription_status,access_suspended,suspension_reason").eq("id",restaurantIds[0]).single();
      expect(afterSuspend.data).toMatchObject({subscription_status:"canceled",access_suspended:true,suspension_reason:"Suscripción manual vencida."});
      const repeatedSuspend=await admin.rpc("process_manual_expirations",{grace_days:3,suspend_access:true,actor_user:userId});
      if(repeatedSuspend.error)throw repeatedSuspend.error;expect(repeatedSuspend.data).toBe(0);

      const audit=await admin.from("superadmin_audit_log").select("action").eq("restaurant_id",restaurantIds[0]).in("action",["payment.expired_marked","access.expired_suspended"]).order("created_at");
      expect(audit.data?.map(item=>item.action).sort()).toEqual(["access.expired_suspended","payment.expired_marked"]);
    }finally{
      if(restaurantIds.length){await admin.from("superadmin_audit_log").delete().in("restaurant_id",restaurantIds);await admin.from("restaurants").delete().in("id",restaurantIds)}
      if(userId)await admin.auth.admin.deleteUser(userId);
    }
  });
});
