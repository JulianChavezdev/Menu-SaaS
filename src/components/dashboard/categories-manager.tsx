"use client";

import {useState,useTransition} from "react";
import {ArrowDown,ArrowUp,Eye,EyeOff,Pencil,Trash2,X} from "lucide-react";
import {toast} from "sonner";
import {deleteCategory,reorderCategories,saveCategory,toggleCategory} from "@/app/dashboard/actions";
import type {Category} from "@/lib/types";
import {AutomaticTranslationNote,notifyAutomaticTranslation} from "@/components/dashboard/automatic-translation";

function reordered(items:Category[],index:number,delta:number){const copy=[...items];const target=index+delta;if(target<0||target>=copy.length)return null;[copy[index],copy[target]]=[copy[target],copy[index]];return copy.map(item=>item.id)}

export function CategoriesManager({categories}:{categories:Category[]}){
  const[selected,setSelected]=useState<Category|null>(null);
  const[busy,start]=useTransition();
  const submit=(form:FormData)=>start(async()=>{try{const result=await saveCategory(form);toast.success(selected?"Categoría actualizada":"Categoría creada");notifyAutomaticTranslation(result.translationStatus);setSelected(null)}catch(error){toast.error(error instanceof Error?error.message:"No se pudo guardar")}});
  const run=(action:()=>Promise<void>,success:string)=>start(async()=>{try{await action();toast.success(success)}catch(error){toast.error(error instanceof Error?error.message:"No se pudo completar la acción")}});
  const move=(index:number,delta:number)=>{const ids=reordered(categories,index,delta);if(ids)run(()=>reorderCategories(ids),"Orden actualizado")};
  return <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
    <form key={selected?.id??"new"} action={submit} className="glass h-fit rounded-2xl p-5">
      <div className="flex items-center justify-between"><h2 className="font-bold">{selected?"Editar categoría":"Nueva categoría"}</h2>{selected&&<button type="button" aria-label="Cancelar edición" onClick={()=>setSelected(null)}><X/></button>}</div>
      {selected&&<input type="hidden" name="id" value={selected.id}/>}
      <label className="mt-4 block">Nombre<input name="name" required defaultValue={selected?.name??""} placeholder="Ej. Entrantes" className="mt-1 w-full rounded-lg p-3 text-slate-900"/></label>
      <AutomaticTranslationNote/>
      <button disabled={busy} className="mt-4 rounded-lg bg-orange-600 text-white px-4 py-2 font-semibold disabled:opacity-50">{busy?"Guardando…":selected?"Guardar cambios":"Crear categoría"}</button>
    </form>
    <div className="space-y-2">{categories.map((category,index)=><article key={category.id} className="glass flex flex-wrap items-center justify-between gap-2 rounded-xl p-3">
      <div><p className="font-semibold">{category.name}</p>{category.translations?.en?.name&&<p className="text-xs text-teal-700">EN · {category.translations.en.name}</p>}<p className="text-xs text-slate-600">{category.is_active?"Visible":"Oculta"}</p></div>
      <div className="flex"><button type="button" title="Subir" disabled={!index||busy} aria-label="Subir categoría" onClick={()=>move(index,-1)} className="p-2 disabled:opacity-30"><ArrowUp/></button><button type="button" title="Bajar" disabled={index===categories.length-1||busy} aria-label="Bajar categoría" onClick={()=>move(index,1)} className="p-2 disabled:opacity-30"><ArrowDown/></button><button type="button" title="Editar" disabled={busy} aria-label={`Editar ${category.name}`} onClick={()=>setSelected(category)} className="p-2 disabled:opacity-30"><Pencil/></button><button type="button" title={category.is_active?"Ocultar":"Mostrar"} disabled={busy} aria-label="Cambiar visibilidad" onClick={()=>run(()=>toggleCategory(category.id,!category.is_active),category.is_active?"Categoría oculta":"Categoría visible")} className="p-2 disabled:opacity-30">{category.is_active?<Eye/>:<EyeOff/>}</button><button type="button" title="Eliminar" disabled={busy} aria-label={`Eliminar ${category.name}`} onClick={()=>{if(confirm(`¿Eliminar ${category.name}?`))run(()=>deleteCategory(category.id),"Categoría eliminada")}} className="p-2 text-red-600 disabled:opacity-30"><Trash2/></button></div>
    </article>)}{!categories.length&&<div className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-slate-500">Todavía no hay categorías. Crea la primera para poder añadir productos.</div>}</div>
  </div>;
}
