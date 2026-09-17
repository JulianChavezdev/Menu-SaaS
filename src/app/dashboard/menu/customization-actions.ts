"use server";
import {revalidatePath} from "next/cache";
import {z} from "zod";
import {activeRestaurant} from "@/lib/permissions";
import {customizationSchema} from "@/lib/product-customization";

export async function saveProductCustomization(productId:string,input:unknown){
  const identifier=z.string().uuid().safeParse(productId);
  if(!identifier.success)return {ok:false as const,error:"Producto no válido"};
  const id=identifier.data;
  const {supabase,restaurant,member}=await activeRestaurant();
  if(!["owner","admin","editor"].includes(member.role))return {ok:false as const,error:"No tienes permisos para editar productos"};
  const parsed=customizationSchema.safeParse(input);
  if(!parsed.success)return {ok:false as const,error:parsed.error.issues[0]?.message??"Revisa las opciones"};
  const photoPrefix=`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/restaurant-media/restaurants/${restaurant.id}/products/${id}/`;
  if(parsed.data.groups.some(g=>g.options.some(o=>o.imageUrl&&!o.imageUrl.startsWith(photoPrefix))))return {ok:false as const,error:"Sube las fotos desde este producto"};
  const {data,error}=await supabase.from("products").update({customization:parsed.data}).eq("id",id).eq("restaurant_id",restaurant.id).select("id").maybeSingle();
  if(error||!data)throw new Error("No se pudo guardar la personalización");
  revalidatePath("/dashboard/menu");revalidatePath(`/r/${restaurant.slug}`);
  return {ok:true as const};
}
