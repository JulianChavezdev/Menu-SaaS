"use client";

import {useState} from "react";
import {Lock} from "lucide-react";
import {toast} from "sonner";
import {updateAppearancePreferences} from "@/app/dashboard/actions";
import {MENU_TEMPLATES,resolveMenuTemplate} from "@/lib/menu-templates";

export function AppearancePreferences({enabled,template,canUsePremium}:{enabled:boolean;template?:string;canUsePremium:boolean}){
  const current=resolveMenuTemplate(template,canUsePremium);
  const[selected,setSelected]=useState(current.key);
  return <form action={async form=>{try{await updateAppearancePreferences(form);toast.success("Preferencias guardadas")}catch(error){toast.error(error instanceof Error?error.message:"No se pudo guardar")}}} className="space-y-5 rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
    <section>
      <h2 className="font-bold">Plantilla de la carta</h2>
      <p className="mt-1 text-sm text-slate-400">Elige el estilo que verán los visitantes.</p>
      <div className="mt-4 grid gap-3">
        {Object.values(MENU_TEMPLATES).map(item=>{const locked=item.tier==="premium"&&!canUsePremium;return <label key={item.key} className={`block rounded-xl border p-4 transition ${locked?"cursor-not-allowed border-white/10 opacity-55":item.key===selected?"cursor-pointer border-violet-400/60 bg-violet-500/10":"cursor-pointer border-white/10 hover:border-white/25"}`}>
          <span className="flex items-center gap-3"><input aria-label={`Seleccionar plantilla ${item.name}`} type="radio" name="menu_template" value={item.key} checked={item.key===selected} onChange={()=>setSelected(item.key)} disabled={locked} className="h-4 w-4 accent-violet-500"/><strong className="flex-1">{item.name}</strong>{item.tier==="premium"?<span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300"><Lock size={11}/>Premium</span>:<span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">Incluida</span>}</span>
          <span className="mt-2 block pl-7 text-xs leading-relaxed text-slate-300">{item.description}</span>
        </label>})}
      </div>
      {!canUsePremium&&<p className="mt-3 text-xs text-slate-500">Las plantillas premium se desbloquean al activar una suscripción.</p>}
    </section>
    <section className="border-t border-white/10 pt-5">
      <h2 className="font-bold">Idiomas de la carta</h2>
      <p className="mt-1 text-sm text-slate-400">Permite que el visitante cambie el idioma de los controles públicos entre español e inglés.</p>
      <label className="mt-4 flex items-center gap-3"><input name="language_switcher_enabled" type="checkbox" defaultChecked={enabled} className="h-5 w-5 accent-violet-500"/><span>Mostrar selector de idioma</span></label>
    </section>
    <button className="w-full rounded-lg bg-violet-600 px-4 py-3 font-semibold">Guardar preferencias</button>
  </form>;
}
