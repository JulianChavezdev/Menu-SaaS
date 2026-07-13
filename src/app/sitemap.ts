import type {MetadataRoute} from "next";
import {createClient} from "@/lib/supabase/server";
import {normalizedAppUrl} from "@/lib/app-url";

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const base=normalizedAppUrl();
  const supabase=await createClient();
  const {data}=await supabase.from("restaurants").select("slug,updated_at").eq("is_published",true);
  return [
    {url:base,lastModified:new Date(),changeFrequency:"weekly",priority:1},
    ...(data??[]).map(restaurant=>({url:`${base}/r/${restaurant.slug}`,lastModified:restaurant.updated_at,changeFrequency:"weekly" as const,priority:.8})),
  ];
}
