import {notFound} from "next/navigation";
import {createClient as createServerClient} from "@/lib/supabase/server";
import {createClient as createSupabaseClient} from "@supabase/supabase-js";
import {getSupabaseSecretKey} from "@/lib/supabase/admin-env";
import {trialIsExpired} from "@/lib/trial-expiration";
import {demoProducts,demoRestaurant} from "@/lib/demo";
import {VideoMenu} from "@/components/menu/video-menu";
import type {Metadata} from "next";

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  if(slug==="bistro-nube"&&!process.env.NEXT_PUBLIC_SUPABASE_URL)return {title:"Bistro Nube | Carta en vídeo",description:demoRestaurant.description??undefined,alternates:{canonical:`/r/${slug}`}};
  const supabase=await createServerClient();
  const {data}=await supabase.from("restaurants").select("name,description,logo_url").eq("slug",slug).maybeSingle();
  if(!data)return {title:"Carta no encontrada"};
  return {title:`${data.name} | Carta en vídeo`,description:data.description??"Carta digital en vídeo",alternates:{canonical:`/r/${slug}`},openGraph:{title:data.name,description:data.description??"Carta digital en vídeo",images:data.logo_url?[data.logo_url]:undefined}};
}

export default async function PublicMenu({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{preview?:string}>}){
  const {slug}=await params;
  const preview=(await searchParams).preview==="landing";
  if(slug==="bistro-nube"&&!process.env.NEXT_PUBLIC_SUPABASE_URL)return <VideoMenu restaurant={demoRestaurant} products={demoProducts} analyticsEnabled={!preview}/>;
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=getSupabaseSecretKey();
  const supabase=url&&key?createSupabaseClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):await createServerClient();
  const {data:restaurant}=await supabase.from("restaurants").select("*,subscriptions(status,current_period_end)").eq("slug",slug).maybeSingle();
  if(!restaurant)notFound();
  const relation=Array.isArray(restaurant.subscriptions)?restaurant.subscriptions[0]:restaurant.subscriptions;
  const paymentRequired=Boolean(restaurant.publication_suspended_for_payment)||restaurant.subscription_status==="past_due"||trialIsExpired(relation?.status,relation?.current_period_end);
  if(trialIsExpired(relation?.status,relation?.current_period_end)&&key)await supabase.rpc("process_expired_trials");
  if(!restaurant.is_published||paymentRequired)return <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-center"><div className="max-w-md"><h1 className="text-3xl font-bold">Carta no disponible</h1><p className="mt-2 text-slate-300">{paymentRequired?"El periodo de prueba ha terminado y el restaurante debe registrar un pago para volver a publicar la carta.":"Este restaurante todavía no ha publicado su carta."}</p></div></main>;
  const {data:products}=await supabase.from("products").select("*,categories!inner(*)").eq("restaurant_id",restaurant.id).eq("is_available",true).eq("categories.is_active",true).order("sort_order");
  if(!products?.length)return <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-center"><div className="glass max-w-md rounded-2xl p-6"><h1 className="text-3xl font-bold">{restaurant.name}</h1><p className="mt-3 text-slate-300">La carta todavía no tiene productos disponibles.</p></div></main>;
  const {subscriptions:_,...publicRestaurant}=restaurant;
  return <VideoMenu restaurant={publicRestaurant} products={products as typeof demoProducts} analyticsEnabled={!preview}/>;
}
