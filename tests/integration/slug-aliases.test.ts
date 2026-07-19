import{createClient}from"@supabase/supabase-js";
import{config}from"dotenv";
import{describe,expect,it}from"vitest";

config({path:".env.local",quiet:true});
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey=process.env.SUPABASE_SECRET_KEY??process.env.SUPABASE_SERVICE_ROLE_KEY;
const suite=url&&serviceKey?describe:describe.skip;

suite("restaurant slug aliases",()=>{
  it("preserves old URLs, reserves aliases and supports reverting",async()=>{
    const admin=createClient(url!,serviceKey!,{auth:{persistSession:false,autoRefreshToken:false}});
    const stamp=`${Date.now()}-${crypto.randomUUID()}`;const oldSlug=`alias-old-${stamp}`;const newSlug=`alias-new-${stamp}`;let userId="";let restaurantId="";
    try{
      const user=await admin.auth.admin.createUser({email:`slug-alias-${stamp}@carta-video.local`,password:`Alias-${crypto.randomUUID()}!`,email_confirm:true});if(user.error)throw user.error;userId=user.data.user.id;
      const restaurant=await admin.from("restaurants").insert({owner_id:userId,name:"Slug alias integration",slug:oldSlug}).select("id").single();if(restaurant.error)throw restaurant.error;restaurantId=restaurant.data.id;

      const changed=await admin.from("restaurants").update({slug:newSlug}).eq("id",restaurantId);expect(changed.error).toBeNull();
      const oldAlias=await admin.from("restaurant_slug_aliases").select("restaurant_id").eq("slug",oldSlug).single();expect(oldAlias.error).toBeNull();expect(oldAlias.data?.restaurant_id).toBe(restaurantId);
      const resolvedAlias=await admin.from("restaurant_slug_aliases").select("restaurants(slug)").eq("slug",oldSlug).single();expect(resolvedAlias.error).toBeNull();expect((resolvedAlias.data?.restaurants as unknown as {slug:string})?.slug).toBe(newSlug);

      const collision=await admin.from("restaurants").insert({owner_id:userId,name:"Reserved slug",slug:oldSlug});expect(collision.error?.code).toBe("23505");

      const reverted=await admin.from("restaurants").update({slug:oldSlug}).eq("id",restaurantId);expect(reverted.error).toBeNull();
      expect((await admin.from("restaurant_slug_aliases").select("slug").eq("slug",oldSlug).maybeSingle()).data).toBeNull();
      expect((await admin.from("restaurant_slug_aliases").select("restaurant_id").eq("slug",newSlug).single()).data?.restaurant_id).toBe(restaurantId);
    }finally{
      if(restaurantId)await admin.from("restaurants").delete().eq("id",restaurantId);
      if(userId)await admin.auth.admin.deleteUser(userId);
    }
  });
});
