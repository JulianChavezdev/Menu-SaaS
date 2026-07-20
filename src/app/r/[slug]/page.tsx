import {notFound,permanentRedirect} from "next/navigation";
import {createClient as createServerClient} from "@/lib/supabase/server";
import {createClient as createSupabaseClient} from "@supabase/supabase-js";
import {getSupabaseSecretKey} from "@/lib/supabase/admin-env";
import {trialIsExpired} from "@/lib/trial-expiration";
import {demoProducts,demoRestaurant} from "@/lib/demo";
import {VideoMenu} from "@/components/menu/video-menu";
import type {Metadata} from "next";

const LANDING_PREVIEW_VIDEO="https://res.cloudinary.com/det6jfwzx/video/upload/c_limit,w_480/q_auto:eco/vc_h264/f_mp4/v1783700256/Generame_un_video_de_una_hambu_oo9gur.mp4";
const RETRY_DELAY_MS=150;

async function retryPublicQuery<T extends {error:unknown}>(load:()=>PromiseLike<T>){let result=await load();if(result.error){await new Promise(resolve=>setTimeout(resolve,RETRY_DELAY_MS));result=await load()}return result}

async function menuDatabase(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=getSupabaseSecretKey();return url&&key?createSupabaseClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):await createServerClient()}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  if(slug==="bistro-nube"&&!process.env.NEXT_PUBLIC_SUPABASE_URL)return {title:"Bistro Nube | Carta en vídeo",description:demoRestaurant.description??undefined,alternates:{canonical:`/r/${slug}`}};
  const supabase=await menuDatabase();
  const {data}=await retryPublicQuery(()=>supabase.from("restaurants").select("name,slug,description,logo_url").eq("slug",slug).maybeSingle());
  let resolved=data;
  if(!resolved){const{data:alias}=await supabase.from("restaurant_slug_aliases").select("restaurants(name,slug,description,logo_url)").eq("slug",slug).maybeSingle();const related=Array.isArray(alias?.restaurants)?alias.restaurants[0]:alias?.restaurants;resolved=related as typeof data}
  if(!resolved)return {title:"Carta no encontrada"};
  return {title:`${resolved.name} | Carta en vídeo`,description:resolved.description??"Carta digital en vídeo",alternates:{canonical:`/r/${resolved.slug}`},openGraph:{title:resolved.name,description:resolved.description??"Carta digital en vídeo",images:resolved.logo_url?[resolved.logo_url]:undefined}};
}

export default async function PublicMenu({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{preview?:string}>}){
  const {slug}=await params;
  const preview=(await searchParams).preview==="landing";
  if(slug==="bistro-nube"&&!process.env.NEXT_PUBLIC_SUPABASE_URL){const previewProducts=preview?demoProducts.map((product,index)=>index===0?{...product,video_url:LANDING_PREVIEW_VIDEO}:product):demoProducts;return <VideoMenu restaurant={demoRestaurant} products={previewProducts} analyticsEnabled={!preview} introEnabled={!preview}/>}
  const key=getSupabaseSecretKey();
  const supabase=await menuDatabase();
  const {data:restaurant}=await retryPublicQuery(()=>supabase.from("restaurants").select("*,subscriptions(status,current_period_end)").eq("slug",slug).maybeSingle());
  if(!restaurant){const{data:alias}=await supabase.from("restaurant_slug_aliases").select("restaurants(slug)").eq("slug",slug).maybeSingle();const related=Array.isArray(alias?.restaurants)?alias.restaurants[0]:alias?.restaurants;const target=related as {slug?:string}|null;if(target?.slug&&target.slug!==slug)permanentRedirect(`/r/${target.slug}${preview?"?preview=landing":""}`);notFound()}
  const relation=Array.isArray(restaurant.subscriptions)?restaurant.subscriptions[0]:restaurant.subscriptions;
  const expiredTrial=trialIsExpired(relation?.status,relation?.current_period_end);
  const paymentRequired=Boolean(restaurant.publication_suspended_for_payment)||restaurant.subscription_status==="past_due";
  if(expiredTrial&&key)await supabase.rpc("process_expired_trials");
  if(!restaurant.is_published||paymentRequired||expiredTrial)return <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-center"><div className="max-w-md"><h1 className="text-3xl font-bold">Carta no disponible</h1><p className="mt-2 text-slate-300">{expiredTrial?"El periodo de prueba ha terminado y la carta se ha eliminado.":paymentRequired?"El restaurante debe registrar un pago para volver a publicar la carta.":"Este restaurante todavía no ha publicado su carta."}</p></div></main>;
  const {data:products}=await supabase.from("products").select("*,categories!inner(*)").eq("restaurant_id",restaurant.id).eq("is_available",true).eq("categories.is_active",true).order("sort_order");
  if(!products?.length)return <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-center"><div className="glass max-w-md rounded-2xl p-6"><h1 className="text-3xl font-bold">{restaurant.name}</h1><p className="mt-3 text-slate-300">La carta todavía no tiene productos disponibles.</p></div></main>;
  const {data:recommendations}=await supabase.from("product_recommendations").select("source_product_id,recommended_product_id,sort_order").eq("restaurant_id",restaurant.id).order("sort_order");
  const productsById=new Map(products.map(product=>[product.id,product]));
  const productsWithRecommendations=products.map(product=>({...product,recommended_products:(recommendations??[]).filter(item=>item.source_product_id===product.id).flatMap(item=>{const recommended=productsById.get(item.recommended_product_id);return recommended?[{id:recommended.id,name:recommended.name,price_cents:recommended.price_cents,image_url:recommended.image_url,is_available:recommended.is_available,translations:recommended.translations}]:[]})}));
  const {subscriptions:_,...publicRestaurant}=restaurant;
  const publicProducts=preview?productsWithRecommendations.map((product,index)=>index===0?{...product,video_url:LANDING_PREVIEW_VIDEO}:product):productsWithRecommendations;
  return <VideoMenu restaurant={publicRestaurant} products={publicProducts as typeof demoProducts} analyticsEnabled={!preview} introEnabled={!preview}/>;
}
