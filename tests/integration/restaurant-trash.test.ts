import {createClient} from "@supabase/supabase-js";
import {config} from "dotenv";
import {describe,expect,it} from "vitest";

config({path:".env.local",quiet:true});
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey=process.env.SUPABASE_SECRET_KEY??process.env.SUPABASE_SERVICE_ROLE_KEY;
const suite=url&&serviceKey?describe:describe.skip;

suite("restaurant trash restore schema",()=>{
  it("deletes and restores an isolated restaurant in safe mode",async()=>{
    const admin=createClient(url!,serviceKey!,{auth:{persistSession:false,autoRefreshToken:false}});
    const stamp=`${Date.now()}-${crypto.randomUUID()}`;let userId="";let restaurantId="";let auditId="";
    try{
      const createdUser=await admin.auth.admin.createUser({email:`trash-${stamp}@carta-video.local`,password:`Trash-${crypto.randomUUID()}!`,email_confirm:true});if(createdUser.error)throw createdUser.error;userId=createdUser.data.user.id;
      const createdRestaurant=await admin.from("restaurants").insert({owner_id:userId,name:"Trash integration",slug:`trash-${stamp}`,is_published:true,subscription_status:"active"}).select("*").single();if(createdRestaurant.error)throw createdRestaurant.error;restaurantId=createdRestaurant.data.id;
      const membership=await admin.from("restaurant_members").insert({restaurant_id:restaurantId,user_id:userId,role:"owner"}).select("*").single();if(membership.error)throw membership.error;
      const category=await admin.from("categories").insert({restaurant_id:restaurantId,name:"Test",slug:"test",is_active:true}).select("*").single();if(category.error)throw category.error;
      const product=await admin.from("products").insert({restaurant_id:restaurantId,category_id:category.data.id,name:"Test product",price_cents:1000,is_available:true}).select("*").single();if(product.error)throw product.error;
      const subscription=await admin.from("subscriptions").insert({restaurant_id:restaurantId,provider:"manual",plan:"carta",status:"active"}).select("*").single();if(subscription.error)throw subscription.error;
      const backup={format:"carta-video.deleted-restaurant",version:2,restaurant:createdRestaurant.data,categories:[category.data],products:[product.data],memberships:[membership.data],subscriptions:[subscription.data],payments:[],media_paths:[]};
      const audit=await admin.from("superadmin_audit_log").insert({actor_user_id:userId,restaurant_id:restaurantId,action:"restaurant.deletion_backup_created",details:{restaurant_name:"Trash integration",slug:createdRestaurant.data.slug,backup}}).select("id").single();if(audit.error)throw audit.error;auditId=audit.data.id;

      const removed=await admin.from("restaurants").delete().eq("id",restaurantId);if(removed.error)throw removed.error;
      expect((await admin.from("products").select("id").eq("restaurant_id",restaurantId)).data).toEqual([]);
      expect((await admin.from("superadmin_audit_log").select("restaurant_id").eq("id",auditId).single()).data?.restaurant_id).toBeNull();

      await admin.from("restaurants").insert({...backup.restaurant,is_published:false,access_suspended:true,subscription_status:"canceled"}).throwOnError();
      await admin.from("categories").insert(backup.categories).throwOnError();await admin.from("products").insert(backup.products).throwOnError();await admin.from("restaurant_members").insert(backup.memberships).throwOnError();await admin.from("subscriptions").insert(backup.subscriptions.map(item=>({...item,status:"canceled"}))).throwOnError();
      const restored=await admin.from("restaurants").select("is_published,access_suspended,subscription_status,products(count),restaurant_members(count)").eq("id",restaurantId).single();
      expect(restored.data).toMatchObject({is_published:false,access_suspended:true,subscription_status:"canceled"});
      expect(restored.data?.products).toEqual([{count:1}]);expect(restored.data?.restaurant_members).toEqual([{count:1}]);
    }finally{
      if(restaurantId)await admin.from("restaurants").delete().eq("id",restaurantId);
      if(auditId)await admin.from("superadmin_audit_log").delete().eq("id",auditId);
      if(userId)await admin.auth.admin.deleteUser(userId);
    }
  });
});
