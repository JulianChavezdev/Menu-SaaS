import {createClient} from "@supabase/supabase-js";
import {config} from "dotenv";
import {describe,expect,it} from "vitest";

config({path:".env.local",quiet:true});
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey=process.env.SUPABASE_SECRET_KEY??process.env.SUPABASE_SERVICE_ROLE_KEY;
const suite=url&&publicKey&&serviceKey?describe:describe.skip;

suite("Storage upload hardening",()=>{
  it("accepts owned logo, MOV video and automatic poster paths",async context=>{
    const admin=createClient(url!,serviceKey!,{auth:{persistSession:false,autoRefreshToken:false}});
    const probe=await admin.rpc("can_manage_restaurant_media",{object_name:"invalid"});
    if(probe.error){context.skip();return}

    const stamp=`${Date.now()}-${crypto.randomUUID()}`;
    const password=`Storage-${crypto.randomUUID()}!`;
    let userId:string|undefined;
    let restaurantId:string|undefined;
    const uploadedPaths:string[]=[];
    try{
      const user=await admin.auth.admin.createUser({email:`storage-${stamp}@carta-video.local`,password,email_confirm:true});
      if(user.error)throw user.error;
      userId=user.data.user.id;

      const restaurant=await admin.from("restaurants").insert({owner_id:userId,name:"Storage test",slug:`storage-${stamp}`,subscription_status:"active"}).select("id").single();
      if(restaurant.error)throw restaurant.error;
      restaurantId=restaurant.data.id;
      const member=await admin.from("restaurant_members").insert({restaurant_id:restaurantId,user_id:userId,role:"owner"});
      if(member.error)throw member.error;
      const category=await admin.from("categories").insert({restaurant_id:restaurantId,name:"Pruebas",slug:"pruebas"}).select("id").single();
      if(category.error)throw category.error;
      const product=await admin.from("products").insert({restaurant_id:restaurantId,category_id:category.data.id,name:"Producto MOV",price_cents:100}).select("id").single();
      if(product.error)throw product.error;

      const owner=createClient(url!,publicKey!,{auth:{persistSession:false,autoRefreshToken:false}});
      const signIn=await owner.auth.signInWithPassword({email:`storage-${stamp}@carta-video.local`,password});
      if(signIn.error)throw signIn.error;

      const validPath=`restaurants/${restaurantId}/branding/logo-${crypto.randomUUID()}.png`;
      const valid=await owner.storage.from("restaurant-media").upload(validPath,new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:"image/png"}));
      expect(valid.error).toBeNull();
      uploadedPaths.push(validPath);

      const movPath=`restaurants/${restaurantId}/products/${product.data.id}/video-${crypto.randomUUID()}.mov`;
      const mov=await owner.storage.from("restaurant-media").upload(movPath,new Blob([new Uint8Array([0,0,0,20,102,116,121,112])],{type:"video/quicktime"}));
      expect(mov.error).toBeNull();
      uploadedPaths.push(movPath);

      const posterPath=`restaurants/${restaurantId}/products/${product.data.id}/image-auto-${crypto.randomUUID()}.jpg`;
      const poster=await owner.storage.from("restaurant-media").upload(posterPath,new Blob([new Uint8Array([255,216,255,217])],{type:"image/jpeg"}));
      expect(poster.error).toBeNull();
      uploadedPaths.push(posterPath);

      const forgedPath=`restaurants/${restaurantId}/branding/cover-${crypto.randomUUID()}.png`;
      const forged=await owner.storage.from("restaurant-media").upload(forgedPath,new Blob([new Uint8Array([137,80,78,71])],{type:"image/png"}));
      expect(forged.error).not.toBeNull();
    }finally{
      if(uploadedPaths.length)await admin.storage.from("restaurant-media").remove(uploadedPaths);
      if(restaurantId)await admin.from("restaurants").delete().eq("id",restaurantId);
      if(userId)await admin.auth.admin.deleteUser(userId);
    }
  });
});
