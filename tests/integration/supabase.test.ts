import {createClient} from "@supabase/supabase-js";
import {config} from "dotenv";
import {beforeAll,describe,expect,it} from "vitest";

config({path:".env.local",quiet:true});
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const suite=url&&key?describe:describe.skip;

suite("Supabase public isolation",()=>{
  const supabase=createClient(url!,key!,{auth:{persistSession:false,autoRefreshToken:false}});let bistroId="";
  beforeAll(async()=>{const {data,error}=await supabase.from("restaurants").select("id,slug,name").eq("slug","bistro-nube").single();if(error)throw error;bistroId=data.id});
  it("reads only the canonical published demo",async()=>{const {data,error}=await supabase.from("restaurants").select("slug").in("slug",["bistro-nube","pizzeria-roma","cafe-central","la-brasa","sushi-yume"]);expect(error).toBeNull();expect(data?.map(item=>item.slug)).toEqual(["bistro-nube"])});
  it("exposes its complete consolidated menu",async()=>{const {data,error}=await supabase.from("products").select("name").eq("restaurant_id",bistroId);expect(error).toBeNull();expect(data).toHaveLength(15)});
  it("blocks anonymous restaurant updates",async()=>{const {data,error}=await supabase.from("restaurants").update({name:"RLS_SHOULD_BLOCK"}).eq("id",bistroId).select("id");expect(error).toBeNull();expect(data).toEqual([]);const {data:restaurant}=await supabase.from("restaurants").select("name").eq("id",bistroId).single();expect(restaurant?.name).toBe("Bistro Nube")});
  it("blocks anonymous restaurant creation",async()=>{const {error}=await supabase.from("restaurants").insert({owner_id:crypto.randomUUID(),name:"Unauthorized",slug:`unauthorized-${Date.now()}`});expect(error).not.toBeNull()});
  it("blocks anonymous Storage uploads",async()=>{const path=`restaurants/${bistroId}/unauthorized-${Date.now()}.txt`;const {error}=await supabase.storage.from("restaurant-media").upload(path,new Blob(["blocked"],{type:"text/plain"}));expect(error).not.toBeNull()});
});
