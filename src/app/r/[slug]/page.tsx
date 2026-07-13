import {notFound} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {demoProducts,demoRestaurant} from "@/lib/demo";
import {VideoMenu} from "@/components/menu/video-menu";
import type {Metadata} from "next";

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  if(slug==="bistro-nube"&&!process.env.NEXT_PUBLIC_SUPABASE_URL)return {title:"Bistro Nube | Carta en vídeo",description:demoRestaurant.description??undefined,alternates:{canonical:`/r/${slug}`}};
  const supabase=await createClient();
  const {data}=await supabase.from("restaurants").select("name,description,logo_url").eq("slug",slug).maybeSingle();
  if(!data)return {title:"Carta no encontrada"};
  return {title:`${data.name} | Carta en vídeo`,description:data.description??"Carta digital en vídeo",alternates:{canonical:`/r/${slug}`},openGraph:{title:data.name,description:data.description??"Carta digital en vídeo",images:data.logo_url?[data.logo_url]:undefined}};
}

export default async function PublicMenu({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  if(slug==="bistro-nube"&&!process.env.NEXT_PUBLIC_SUPABASE_URL)return <VideoMenu restaurant={demoRestaurant} products={demoProducts}/>;
  const supabase=await createClient();
  const {data:restaurant}=await supabase.from("restaurants").select("*").eq("slug",slug).maybeSingle();
  if(!restaurant)notFound();
  if(!restaurant.is_published)return <main className="grid min-h-screen place-items-center p-6 text-center"><div><h1 className="text-3xl font-bold">Carta no disponible</h1><p className="mt-2 text-slate-300">Este restaurante todavía no ha publicado su carta.</p></div></main>;
  const {data:products}=await supabase.from("products").select("*,categories!inner(*)").eq("restaurant_id",restaurant.id).eq("is_available",true).eq("categories.is_active",true).order("sort_order");
  if(!products?.length)return <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-center"><div className="glass max-w-md rounded-2xl p-6"><h1 className="text-3xl font-bold">{restaurant.name}</h1><p className="mt-3 text-slate-300">La carta todavía no tiene productos disponibles.</p></div></main>;
  return <VideoMenu restaurant={restaurant} products={products as typeof demoProducts}/>;
}
