"use client";

import {useState} from "react";
import {Trash2,TriangleAlert} from "lucide-react";
import {deleteRestaurant} from "@/app/superadmin/actions";
import {matchesRestaurantDeletion,restaurantDeletionPhrase} from "@/lib/restaurant-deletion";

export function DeleteRestaurantPanel({restaurantId,restaurantName,restaurantSlug,superadminEmail}:{restaurantId:string;restaurantName:string;restaurantSlug:string;superadminEmail:string}){
  const[email,setEmail]=useState("");
  const[confirmation,setConfirmation]=useState("");
  const[acknowledged,setAcknowledged]=useState(false);
  const phrase=restaurantDeletionPhrase(restaurantSlug);
  const ready=matchesRestaurantDeletion({slug:restaurantSlug,typedPhrase:confirmation,expectedEmail:superadminEmail,typedEmail:email,acknowledged});
  return <details className="mt-6 rounded-3xl border border-red-500/25 bg-red-500/[.05] p-5">
    <summary className="flex cursor-pointer list-none items-center gap-2 font-bold text-red-700"><TriangleAlert size={19}/>Zona de peligro: eliminar restaurante</summary>
    <div className="mt-4 border-t border-red-500/15 pt-4"><p className="text-sm leading-relaxed text-slate-700">Eliminarás permanentemente <strong>{restaurantName}</strong>, su carta, miembros, pagos y analíticas. El usuario propietario no se elimina. Antes de continuar se guardará una copia administrativa final de la configuración y la carta.</p>
      <form action={deleteRestaurant} className="mt-4 grid gap-3">
        <input type="hidden" name="restaurant_id" value={restaurantId}/>
        <label className="text-sm text-slate-700">Confirma tu correo de superadmin<input required name="security_email" type="email" autoComplete="off" value={email} onChange={event=>setEmail(event.target.value)} placeholder="tu-correo@ejemplo.com" className="mt-1.5 w-full rounded-xl border border-red-500/20 bg-white p-3 text-slate-950 outline-none focus:border-red-400"/></label>
        <label className="text-sm text-slate-700">Escribe exactamente <code className="rounded bg-stone-100 px-1.5 py-1 text-red-700">{phrase}</code><input required name="confirmation" autoComplete="off" spellCheck={false} value={confirmation} onChange={event=>setConfirmation(event.target.value)} className="mt-1.5 w-full rounded-xl border border-red-500/20 bg-white p-3 text-slate-950 outline-none focus:border-red-400"/></label>
        <label className="flex items-start gap-2 rounded-xl border border-red-500/15 p-3 text-xs leading-relaxed text-slate-600"><input required name="acknowledge" value="yes" type="checkbox" checked={acknowledged} onChange={event=>setAcknowledged(event.target.checked)} className="mt-0.5"/>Entiendo que esta acción no se puede deshacer desde el panel.</label>
        <button disabled={!ready} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-35"><Trash2 size={17}/>Eliminar definitivamente</button>
      </form>
    </div>
  </details>;
}
