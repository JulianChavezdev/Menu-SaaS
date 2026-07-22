import {createClient} from "@supabase/supabase-js";
import {config} from "dotenv";
import {describe,expect,it} from "vitest";
import {uploadVideoResumable} from "../../src/lib/resumable-video-upload";

config({path:".env.local",quiet:true});
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey=process.env.SUPABASE_SECRET_KEY??process.env.SUPABASE_SERVICE_ROLE_KEY;
const suite=url&&publicKey&&serviceKey?describe:describe.skip;

suite("resumable video upload",()=>{
  it("uploads a tenant-scoped product video through Supabase TUS",async()=>{
    const admin=createClient(url!,serviceKey!,{auth:{persistSession:false,autoRefreshToken:false}});
    const stamp=`${Date.now()}-${crypto.randomUUID()}`;
    const password=`Resumable-${crypto.randomUUID()}!`;
    let userId="",restaurantId="",path="";
    try{
      const created=await admin.auth.admin.createUser({email:`resumable-${stamp}@carta-video.local`,password,email_confirm:true});
      if(created.error)throw created.error;userId=created.data.user.id;
      const restaurant=await admin.from("restaurants").insert({owner_id:userId,name:"Resumable test",slug:`resumable-${stamp}`,subscription_status:"active"}).select("id").single();
      if(restaurant.error)throw restaurant.error;restaurantId=restaurant.data.id;
      await admin.from("restaurant_members").insert({restaurant_id:restaurantId,user_id:userId,role:"owner"}).throwOnError();
      const category=await admin.from("categories").insert({restaurant_id:restaurantId,name:"Carta",slug:"carta"}).select("id").single();
      if(category.error)throw category.error;
      const product=await admin.from("products").insert({restaurant_id:restaurantId,category_id:category.data.id,name:"Vídeo",price_cents:100}).select("id").single();
      if(product.error)throw product.error;
      const owner=createClient(url!,publicKey!,{auth:{persistSession:false,autoRefreshToken:false}});
      const login=await owner.auth.signInWithPassword({email:`resumable-${stamp}@carta-video.local`,password});
      if(login.error)throw login.error;
      path=`restaurants/${restaurantId}/products/${product.data.id}/video-${crypto.randomUUID()}.mp4`;
      const progress:number[]=[];
      await uploadVideoResumable({file:Buffer.alloc(1024) as unknown as File,path,supabaseUrl:url!,accessToken:login.data.session.access_token,onProgress:value=>progress.push(value)});
      const listed=await admin.storage.from("restaurant-media").list(`restaurants/${restaurantId}/products/${product.data.id}`);
      expect(listed.error).toBeNull();expect(listed.data?.some(item=>path.endsWith(item.name))).toBe(true);expect(progress.at(-1)).toBe(100);
    }finally{
      if(path)await admin.storage.from("restaurant-media").remove([path]);
      if(restaurantId)await admin.from("restaurants").delete().eq("id",restaurantId);
      if(userId)await admin.auth.admin.deleteUser(userId);
    }
  });
});
