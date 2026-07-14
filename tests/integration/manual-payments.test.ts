import {createClient} from "@supabase/supabase-js";
import {config} from "dotenv";
import {describe,expect,it} from "vitest";

config({path:".env.local",quiet:true});
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const suite=url&&publicKey&&serviceKey?describe:describe.skip;

suite("manual Bizum subscriptions",()=>{
  it("records a payment atomically, restores access and keeps the ledger private",async context=>{
    const admin=createClient(url!,serviceKey!,{auth:{persistSession:false,autoRefreshToken:false}});
    const probe=await admin.from("manual_payments").select("id",{head:true}).limit(1);
    if(probe.error){context.skip();return}
    const stamp=`${Date.now()}-${crypto.randomUUID()}`;
    let userId:string|undefined;let restaurantId:string|undefined;
    try{
      const user=await admin.auth.admin.createUser({email:`manual-payment-${stamp}@carta-video.local`,password:`Payment-${crypto.randomUUID()}!`,email_confirm:true});
      if(user.error)throw user.error;userId=user.data.user.id;
      const restaurant=await admin.from("restaurants").insert({owner_id:userId,name:"Manual payment test",slug:`manual-payment-${stamp}`,subscription_status:"canceled",access_suspended:true,suspension_reason:"Payment pending",suspended_at:new Date().toISOString()}).select("id").single();
      if(restaurant.error)throw restaurant.error;restaurantId=restaurant.data.id;
      const subscription=await admin.from("subscriptions").insert({restaurant_id:restaurantId,provider:"manual",plan:"carta",status:"canceled"});
      if(subscription.error)throw subscription.error;

      const base={target_restaurant:restaurantId,payment_amount_cents:2900,payment_currency:"EUR",payment_method:"bizum",payment_paid_at:"2026-07-14T12:00:00.000Z",payment_reference:"integration-test",payment_notes:"temporary",actor_user:userId};
      const invalid=await admin.rpc("record_manual_payment",{...base,payment_period_end:"2026-07-13T23:59:59.999Z"});
      expect(invalid.error).not.toBeNull();
      const afterInvalid=await admin.from("restaurants").select("subscription_status,access_suspended").eq("id",restaurantId).single();
      expect(afterInvalid.data).toMatchObject({subscription_status:"canceled",access_suspended:true});

      const valid=await admin.rpc("record_manual_payment",{...base,payment_period_end:"2026-08-14T23:59:59.999Z"});
      if(valid.error)throw valid.error;
      const [restored,updatedSubscription,payments]=await Promise.all([
        admin.from("restaurants").select("subscription_status,access_suspended,suspension_reason").eq("id",restaurantId).single(),
        admin.from("subscriptions").select("provider,status,current_period_end,provider_customer_id,provider_subscription_id").eq("restaurant_id",restaurantId).single(),
        admin.from("manual_payments").select("amount_cents,method,reference").eq("restaurant_id",restaurantId),
      ]);
      expect(restored.data).toMatchObject({subscription_status:"active",access_suspended:false,suspension_reason:null});
      expect(updatedSubscription.data).toMatchObject({provider:"manual",status:"active",provider_customer_id:null,provider_subscription_id:null});
      expect(payments.data).toEqual([{amount_cents:2900,method:"bizum",reference:"integration-test"}]);

      const anonymous=createClient(url!,publicKey!,{auth:{persistSession:false,autoRefreshToken:false}});
      const privateLedger=await anonymous.from("manual_payments").select("id").eq("restaurant_id",restaurantId);
      expect(privateLedger.error).not.toBeNull();
    }finally{
      if(restaurantId)await admin.from("restaurants").delete().eq("id",restaurantId);
      if(userId)await admin.auth.admin.deleteUser(userId);
    }
  });
});
