import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {VideoMenu} from "@/components/menu/video-menu";
import {requireSuperadmin} from "@/lib/superadmin";
import type {Product,Restaurant} from "@/lib/types";

export const metadata:Metadata={title:"Vista previa de carta",robots:{index:false,follow:false}};

export default async function SuperadminMenuPreview({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const {admin}=await requireSuperadmin();
  const[{data:restaurant},{data:products}]=await Promise.all([
    admin.from("restaurants").select("*").eq("id",id).maybeSingle(),
    admin.from("products").select("*,categories!inner(*)").eq("restaurant_id",id).eq("is_available",true).eq("categories.is_active",true).order("sort_order"),
  ]);
  if(!restaurant)notFound();
  if(!products?.length)return <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-center"><div className="glass max-w-md rounded-2xl p-6"><h1 className="text-3xl font-bold">{restaurant.name}</h1><p className="mt-3 text-slate-300">La carta no tiene productos disponibles para previsualizar.</p></div></main>;
  return <VideoMenu restaurant={restaurant as Restaurant} products={products as Product[]} analyticsEnabled={false}/>;
}
