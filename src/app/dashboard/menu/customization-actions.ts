"use server";
import {revalidatePath} from "next/cache";
import {z} from "zod";
import {activeRestaurant} from "@/lib/permissions";
import {customizationSchema} from "@/lib/product-customization";

export async function saveProductCustomization(productId:string,input:unknown){
  const id=z.string().uuid().parse(productId);
  const {supabase,restaurant,member}=await activeRestaurant();
  if(!["owner","admin","editor"].includes(member.role))throw new Error("No tienes permisos para editar productos");
  const parsed=customizationSchema.safeParse(input);
  if(!parsed.success)throw new Error(parsed.error.issues[0]?.message??"Revisa las opciones");
  const photoPrefix=`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/restaurant-media/restaurants/${restaurant.id}/products/${id}/`;
  if(parsed.data.groups.some(g=>g.options.some(o=>o.imageUrl&&!o.imageUrl.startsWith(photoPrefix))))throw new Error("Sube las fotos desde este producto");
  const {data,error}=await supabase.from("products").update({customization:parsed.data}).eq("id",id).eq("restaurant_id",restaurant.id).select("id").maybeSingle();
  if(error||!data)throw new Error("No se pudo guardar la personalización");
  revalidatePath("/dashboard/menu");revalidatePath(`/r/${restaurant.slug}`);
}
