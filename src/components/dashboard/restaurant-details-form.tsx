"use client";

import {toast} from "sonner";
import {updateRestaurant} from "@/app/dashboard/actions";
import type {Restaurant} from "@/lib/types";
import {AutomaticTranslationNote,notifyAutomaticTranslation} from "@/components/dashboard/automatic-translation";

export function RestaurantDetailsForm({restaurant}:{restaurant:Restaurant}){
  return <form action={async form=>{try{const result=await updateRestaurant(form);toast.success("Cambios guardados");notifyAutomaticTranslation(result.translationStatus)}catch{toast.error("No se pudo guardar")}}} className="glass grid max-w-2xl gap-3 rounded-2xl p-5 md:grid-cols-2">
    <label>Nombre<input name="name" required defaultValue={restaurant.name} className="mt-1 w-full rounded-lg p-3 text-slate-900"/></label>
    <label>Correo<input name="email" type="email" defaultValue={restaurant.email??""} className="mt-1 w-full rounded-lg p-3 text-slate-900"/></label>
    <label>Teléfono<input name="phone" defaultValue={restaurant.phone??""} className="mt-1 w-full rounded-lg p-3 text-slate-900"/></label>
    <label>Dirección<input name="address" defaultValue={restaurant.address??""} className="mt-1 w-full rounded-lg p-3 text-slate-900"/></label>
    <label className="md:col-span-2">Descripción<textarea name="description" defaultValue={restaurant.description??""} className="mt-1 min-h-28 w-full rounded-lg p-3 text-slate-900"/></label>
    <div className="md:col-span-2"><AutomaticTranslationNote/></div>
    <label className="flex items-center gap-2 md:col-span-2"><input name="is_published" defaultChecked={restaurant.is_published} type="checkbox"/>Publicar carta</label>
    <button className="w-fit rounded-lg bg-orange-600 text-white px-4 py-2 font-semibold">Guardar cambios</button>
  </form>;
}
