"use client";

import{useState}from"react";
import {toast} from "sonner";
import {updateRestaurant} from "@/app/dashboard/actions";
import type {Restaurant} from "@/lib/types";
import{normalizePublicSlug}from"@/lib/public-slug";
import {AutomaticTranslationNote,notifyAutomaticTranslation} from "@/components/dashboard/automatic-translation";

export function RestaurantDetailsForm({restaurant}:{restaurant:Restaurant}){
  const[name,setName]=useState(restaurant.name);const[slug,setSlug]=useState(restaurant.slug);
  return <form action={async form=>{try{const result=await updateRestaurant(form);toast.success("Cambios guardados");notifyAutomaticTranslation(result.translationStatus)}catch(error){toast.error(error instanceof Error?error.message:"No se pudo guardar")}}} className="glass grid max-w-2xl gap-3 rounded-2xl p-5 md:grid-cols-2">
    <label>Nombre<input name="name" required value={name} onChange={event=>setName(event.target.value)} className="mt-1 w-full rounded-lg p-3 text-slate-900"/></label>
    <div><label htmlFor="restaurant-slug">URL pública</label><div className="mt-1 flex items-center overflow-hidden rounded-lg border border-stone-300 bg-white"><span className="shrink-0 border-r border-stone-200 bg-stone-50 px-3 py-3 text-xs text-slate-500">menuly.es/r/</span><input id="restaurant-slug" name="slug" required minLength={3} maxLength={60} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={slug} onChange={event=>setSlug(normalizePublicSlug(event.target.value))} aria-describedby="slug-help" className="min-w-0 flex-1 border-0 p-3 text-slate-900 outline-none"/></div><span id="slug-help" className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500"><span>La dirección anterior redirigirá automáticamente a la nueva.</span><button type="button" onClick={()=>setSlug(normalizePublicSlug(name))} className="shrink-0 font-semibold text-orange-700 underline">Usar el nombre</button></span></div>
    <label>Correo<input name="email" type="email" defaultValue={restaurant.email??""} className="mt-1 w-full rounded-lg p-3 text-slate-900"/></label>
    <label>Teléfono<input name="phone" defaultValue={restaurant.phone??""} className="mt-1 w-full rounded-lg p-3 text-slate-900"/></label>
    <label>Dirección<input name="address" defaultValue={restaurant.address??""} className="mt-1 w-full rounded-lg p-3 text-slate-900"/></label>
    <label className="md:col-span-2">Descripción<textarea name="description" defaultValue={restaurant.description??""} className="mt-1 min-h-28 w-full rounded-lg p-3 text-slate-900"/></label>
    <div className="md:col-span-2"><AutomaticTranslationNote/></div>
    <label className="flex items-center gap-2 md:col-span-2"><input name="is_published" defaultChecked={restaurant.is_published} type="checkbox"/>Publicar carta</label>
    <button className="w-fit rounded-lg bg-orange-600 text-white px-4 py-2 font-semibold">Guardar cambios</button>
  </form>;
}
