import {createClient} from "@supabase/supabase-js";
import {config} from "dotenv";
import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

config({path:".env.local",quiet:true});
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const suite=url&&publicKey?describe:describe.skip;
const showcase=JSON.parse(readFileSync("supabase/showcase-data.json","utf8")) as {restaurants:Array<{slug:string;products:Array<{name:string}>}>};

suite("aislamiento del escaparate público",()=>{
  it("cada slug expone exclusivamente los productos de su restaurante",async()=>{
    const anonymous=createClient(url!,publicKey!,{auth:{persistSession:false,autoRefreshToken:false}});
    const seenIds=new Set<string>();
    for(const expected of showcase.restaurants){
      const restaurant=await anonymous.from("restaurants").select("id,slug,is_published").eq("slug",expected.slug).single();
      if(restaurant.error)throw restaurant.error;
      expect(restaurant.data.is_published).toBe(true);
      expect(seenIds.has(restaurant.data.id)).toBe(false);
      seenIds.add(restaurant.data.id);
      const products=await anonymous.from("products").select("name,restaurant_id").eq("restaurant_id",restaurant.data.id).order("sort_order");
      if(products.error)throw products.error;
      expect(products.data.map(product=>product.name)).toEqual(expected.products.map(product=>product.name));
      expect(products.data.every(product=>product.restaurant_id===restaurant.data.id)).toBe(true);
    }
    expect(seenIds.size).toBe(5);
  });
});
