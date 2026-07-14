import {createClient} from "@supabase/supabase-js";
import {config} from "dotenv";
import {describe,expect,it} from "vitest";

config({path:".env.local",quiet:true});
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey=process.env.SUPABASE_SECRET_KEY??process.env.SUPABASE_SERVICE_ROLE_KEY;
const suite=url&&publicKey&&serviceKey?describe:describe.skip;

suite("Supabase security hardening",()=>{
  it("protects unpublished content, memberships, billing and trial limits",async context=>{
    const admin=createClient(url!,serviceKey!,{auth:{persistSession:false,autoRefreshToken:false}});
    const probe=await admin.rpc("is_published_restaurant",{target:crypto.randomUUID()});
    if(probe.error){context.skip();return}

    const stamp=`${Date.now()}-${crypto.randomUUID()}`;
    const password=`Security-${crypto.randomUUID()}!`;
    const createdUsers:string[]=[];
    const createdRestaurants:string[]=[];
    try{
      const first=await admin.auth.admin.createUser({email:`security-owner-${stamp}@carta-video.local`,password,email_confirm:true});
      const second=await admin.auth.admin.createUser({email:`security-other-${stamp}@carta-video.local`,password,email_confirm:true});
      if(first.error)throw first.error;if(second.error)throw second.error;
      createdUsers.push(first.data.user.id,second.data.user.id);

      for(const [index,userId] of createdUsers.entries()){
        const restaurant=await admin.from("restaurants").insert({owner_id:userId,name:`Security ${index}`,slug:`security-${index}-${stamp}`}).select("id").single();
        if(restaurant.error)throw restaurant.error;
        createdRestaurants.push(restaurant.data.id);
        const member=await admin.from("restaurant_members").insert({restaurant_id:restaurant.data.id,user_id:userId,role:"owner"});
        if(member.error)throw member.error;
      }

      const categories:string[]=[];
      for(const [index,restaurantId] of createdRestaurants.entries()){
        const category=await admin.from("categories").insert({restaurant_id:restaurantId,name:"Hidden",slug:`hidden-${index}`}).select("id").single();
        if(category.error)throw category.error;
        categories.push(category.data.id);
      }

      const products=await admin.from("products").insert([0,1,2].map(index=>({restaurant_id:createdRestaurants[0],category_id:categories[0],name:`Hidden ${index}`,price_cents:100+index}))).select("id");
      if(products.error)throw products.error;

      const anonymous=createClient(url!,publicKey!,{auth:{persistSession:false,autoRefreshToken:false}});
      const [hiddenCategories,hiddenProducts]=await Promise.all([
        anonymous.from("categories").select("id").eq("restaurant_id",createdRestaurants[0]),
        anonymous.from("products").select("id").eq("restaurant_id",createdRestaurants[0]),
      ]);
      expect(hiddenCategories.data).toEqual([]);
      expect(hiddenProducts.data).toEqual([]);

      const owner=createClient(url!,publicKey!,{auth:{persistSession:false,autoRefreshToken:false}});
      const signIn=await owner.auth.signInWithPassword({email:`security-owner-${stamp}@carta-video.local`,password});
      if(signIn.error)throw signIn.error;
      const billingChange=await owner.from("restaurants").update({subscription_status:"active"}).eq("id",createdRestaurants[0]);
      expect(billingChange.error).not.toBeNull();
      const membershipEscalation=await owner.from("restaurant_members").insert({restaurant_id:createdRestaurants[1],user_id:createdUsers[0],role:"owner"});
      expect(membershipEscalation.error).not.toBeNull();

      const crossTenant=await admin.from("products").insert({restaurant_id:createdRestaurants[0],category_id:categories[1],name:"Cross tenant",price_cents:100});
      expect(crossTenant.error).not.toBeNull();
      const overLimit=await admin.from("products").insert({restaurant_id:createdRestaurants[0],category_id:categories[0],name:"Fourth product",price_cents:100});
      expect(overLimit.error).not.toBeNull();
    }finally{
      for(const restaurantId of createdRestaurants)await admin.from("restaurants").delete().eq("id",restaurantId);
      for(const userId of createdUsers)await admin.auth.admin.deleteUser(userId);
    }
  });
});
