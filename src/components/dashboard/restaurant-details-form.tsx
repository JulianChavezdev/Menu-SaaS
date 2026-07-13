"use client";

import {toast} from "sonner";
import {updateRestaurant} from "@/app/dashboard/actions";
import type {Restaurant} from "@/lib/types";

export function RestaurantDetailsForm({restaurant}:{restaurant:Restaurant}){
  return <form action={async form=>{try{await updateRestaurant(form);toast.success("Cambios guardados")}catch{toast.error("No se pudo guardar")}}} className="glass grid max-w-2xl gap-3 rounded-2xl p-5 md:grid-cols-2">
    <label>Nombre<input name="name" required defaultValue={restaurant.name} className="mt-1 w-full rounded-lg p-3 text-slate-900"/></label>
    <label>Correo<input name="email" type="email" defaultValue={restaurant.email??""} className="mt-1 w-full rounded-lg p-3 text-slate-900"/></label>
    <label>Teléfono<input name="phone" defaultValue={restaurant.phone??""} className="mt-1 w-full rounded-lg p-3 text-slate-900"/></label>
    <label>Dirección<input name="address" defaultValue={restaurant.address??""} className="mt-1 w-full rounded-lg p-3 text-slate-900"/></label>
    <label className="md:col-span-2">Descripción<textarea name="description" defaultValue={restaurant.description??""} className="mt-1 min-h-28 w-full rounded-lg p-3 text-slate-900"/></label>
    <details className="rounded-xl border border-white/10 bg-white/[.03] p-3 md:col-span-2"><summary className="cursor-pointer text-sm font-semibold text-slate-300">Traducción al inglés (opcional)</summary><label className="mt-3 block text-sm">Descripción en inglés<textarea name="description_en" defaultValue={restaurant.translations?.en?.description??""} className="mt-1 min-h-24 w-full rounded-lg p-3 text-slate-900"/></label></details>
    <label className="flex items-center gap-2 md:col-span-2"><input name="is_published" defaultChecked={restaurant.is_published} type="checkbox"/>Publicar carta</label>
    <button className="w-fit rounded-lg bg-violet-500 px-4 py-2 font-semibold">Guardar cambios</button>
  </form>;
}
