import type {MetadataRoute} from "next";
import {createClient} from "@supabase/supabase-js";
import {getSupabaseSecretKey} from "@/lib/supabase/admin-env";
import {normalizedAppUrl} from "@/lib/app-url";

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const base=normalizedAppUrl();
  const key=getSupabaseSecretKey(),url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabase=key&&url?createClient(url,key,{auth:{persistSession:false}}):null;
  const {data}=supabase?await supabase.from("restaurants").select("slug,updated_at").eq("is_published",true).eq("access_suspended",false).eq("publication_suspended_for_payment",false).in("subscription_status",["active","trialing"]):{data:[]};
  return [
    {url:base,lastModified:new Date(),changeFrequency:"weekly",priority:1},
    ...(data??[]).map(restaurant=>({url:`${base}/r/${restaurant.slug}`,lastModified:restaurant.updated_at,changeFrequency:"weekly" as const,priority:.8})),
  ];
}
