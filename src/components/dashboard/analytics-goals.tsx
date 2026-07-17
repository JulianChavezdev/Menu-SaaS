"use client";

import {useTransition} from "react";
import {Target} from "lucide-react";
import {toast} from "sonner";
import {saveAnalyticsGoals} from "@/app/dashboard/actions";

export function AnalyticsGoals({views,adds,viewGoal,addGoal}:{views:number;adds:number;viewGoal:number;addGoal:number}){
  const[busy,start]=useTransition();
  return <section className="mt-6 border border-stone-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Target className="text-orange-700" size={20}/><div><h2 className="font-bold">Objetivos semanales</h2><p className="mt-1 text-xs text-slate-500">Define una referencia realista y revisa el progreso cada semana.</p></div></div><div className="mt-5 grid gap-5 md:grid-cols-2"><Goal label="Visitas a la carta" value={views} goal={viewGoal}/><Goal label="Añadidos al carrito" value={adds} goal={addGoal}/></div><form action={form=>start(async()=>{try{await saveAnalyticsGoals(form);toast.success("Objetivos actualizados")}catch(error){toast.error(error instanceof Error?error.message:"No se pudieron guardar")}})} className="mt-5 grid gap-3 border-t border-stone-200 pt-4 sm:grid-cols-[1fr_1fr_auto]"><label className="text-xs font-bold text-slate-600">Meta de visitas<input name="weekly_menu_views" type="number" min={1} max={1000000} defaultValue={viewGoal} className="mt-1 w-full border border-stone-300 p-2.5 text-slate-900"/></label><label className="text-xs font-bold text-slate-600">Meta de añadidos<input name="weekly_cart_adds" type="number" min={1} max={100000} defaultValue={addGoal} className="mt-1 w-full border border-stone-300 p-2.5 text-slate-900"/></label><button disabled={busy} className="min-h-11 self-end bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy?"Guardando…":"Guardar metas"}</button></form></section>;
}

function Goal({label,value,goal}:{label:string;value:number;goal:number}){const percentage=Math.min(100,Math.round(value/goal*100));return <div><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 text-2xl font-black tabular-nums">{value} <span className="text-sm font-semibold text-slate-400">/ {goal}</span></p></div><strong className="text-sm text-orange-700">{percentage}%</strong></div><div className="mt-2 h-2 overflow-hidden bg-stone-100"><div className="h-full bg-orange-600 transition-all" style={{width:`${percentage}%`}}/></div></div>}
