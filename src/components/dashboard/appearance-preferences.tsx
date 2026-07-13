"use client";

import {toast} from "sonner";
import {updateAppearancePreferences} from "@/app/dashboard/actions";
import {MENU_TEMPLATES,resolveMenuTemplate} from "@/lib/menu-templates";

export function AppearancePreferences({enabled,template}:{enabled:boolean;template?:string}){
  const current=resolveMenuTemplate(template);
  return <form action={async form=>{try{await updateAppearancePreferences(form);toast.success("Preferencias guardadas")}catch(error){toast.error(error instanceof Error?error.message:"No se pudo guardar")}}} className="space-y-5 rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
    <section>
      <h2 className="font-bold">Plantilla de la carta</h2>
      <p className="mt-1 text-sm text-slate-400">La estructura ya admite futuras plantillas gratuitas y premium.</p>
      <label className="mt-4 block rounded-xl border border-violet-400/40 bg-violet-500/10 p-4">
        <span className="flex items-center justify-between gap-3"><strong>{current.name}</strong><span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">Incluida</span></span>
        <span className="mt-1 block text-xs leading-relaxed text-slate-300">{current.description}</span>
        <select name="menu_template" defaultValue={current.key} className="sr-only" aria-label="Plantilla de la carta">{Object.values(MENU_TEMPLATES).map(item=><option key={item.key} value={item.key}>{item.name}</option>)}</select>
      </label>
    </section>
    <section className="border-t border-white/10 pt-5">
      <h2 className="font-bold">Idiomas de la carta</h2>
      <p className="mt-1 text-sm text-slate-400">Permite que el visitante cambie el idioma de los controles públicos entre español e inglés.</p>
      <label className="mt-4 flex items-center gap-3"><input name="language_switcher_enabled" type="checkbox" defaultChecked={enabled} className="h-5 w-5 accent-violet-500"/><span>Mostrar selector de idioma</span></label>
    </section>
    <button className="w-full rounded-lg bg-violet-600 px-4 py-3 font-semibold">Guardar preferencias</button>
  </form>;
}
