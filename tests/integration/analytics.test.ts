import {createClient} from "@supabase/supabase-js";
import {config} from "dotenv";
import {describe,expect,it} from "vitest";

config({path:".env.local",quiet:true});
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const publicKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const suite=url&&publicKey&&serviceKey?describe:describe.skip;

suite("privacy-safe menu analytics",()=>{
  it("aggregates published events and isolates restaurant statistics",async context=>{
    const admin=createClient(url!,serviceKey!,{auth:{persistSession:false,autoRefreshToken:false}});
    const probe=await admin.from("menu_analytics_daily").select("event_count",{head:true}).limit(1);
    if(probe.error){context.skip();return}
    const functionProbe=await admin.rpc("record_menu_analytics_event",{target_restaurant:crypto.randomUUID(),target_product:null,target_event:"invalid",target_locale:"es"});
    if(functionProbe.error?.code==="PGRST202"){context.skip();return}
    expect(functionProbe.error?.code).toBe("22023");
    const stamp=`${Date.now()}-${crypto.randomUUID()}`;const password=`Analytics-${crypto.randomUUID()}!`;let userId:string|undefined;let restaurantId:string|undefined;
    try{
      const user=await admin.auth.admin.createUser({email:`analytics-${stamp}@carta-video.local`,password,email_confirm:true});if(user.error)throw user.error;userId=user.data.user.id;
      const restaurant=await admin.from("restaurants").insert({owner_id:userId,name:"Analytics test",slug:`analytics-${stamp}`,is_published:true}).select("id").single();if(restaurant.error)throw restaurant.error;restaurantId=restaurant.data.id;
      const member=await admin.from("restaurant_members").insert({restaurant_id:restaurantId,user_id:userId,role:"owner"});if(member.error)throw member.error;
      const category=await admin.from("categories").insert({restaurant_id:restaurantId,name:"Analytics",slug:"analytics"}).select("id").single();if(category.error)throw category.error;
      const product=await admin.from("products").insert({restaurant_id:restaurantId,category_id:category.data.id,name:"Measured",price_cents:100}).select("id").single();if(product.error)throw product.error;
      const record=(event:string,productId:string|null=null,locale="es")=>admin.rpc("record_menu_analytics_event",{target_restaurant:restaurantId!,target_product:productId,target_event:event,target_locale:locale});
      for(const result of [await record("menu_view"),await record("menu_view"),await record("product_view",product.data.id),await record("share",null,"en")])if(result.error)throw result.error;
      const rejectedProduct=await record("product_view",crypto.randomUUID());expect(rejectedProduct.error?.code).toBe("42501");

      const owner=createClient(url!,publicKey!,{auth:{persistSession:false,autoRefreshToken:false}});const login=await owner.auth.signInWithPassword({email:`analytics-${stamp}@carta-video.local`,password});if(login.error)throw login.error;
      const visible=await owner.from("menu_analytics_daily").select("event_type,event_count,locale").eq("restaurant_id",restaurantId);expect(visible.error).toBeNull();expect(visible.data?.find(row=>row.event_type==="menu_view")?.event_count).toBe(2);expect(visible.data?.find(row=>row.event_type==="share")?.locale).toBe("en");
      const anonymous=createClient(url!,publicKey!,{auth:{persistSession:false,autoRefreshToken:false}});const privateRows=await anonymous.from("menu_analytics_daily").select("event_count").eq("restaurant_id",restaurantId);expect(privateRows.error).not.toBeNull();
      await admin.from("restaurants").update({access_suspended:true}).eq("id",restaurantId);const suspendedEvent=await record("menu_view");expect(suspendedEvent.error?.code).toBe("42501");
    }finally{if(restaurantId)await admin.from("restaurants").delete().eq("id",restaurantId);if(userId)await admin.auth.admin.deleteUser(userId)}
  });
});
