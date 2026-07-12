"use client";

import {useState,useTransition} from "react";
import {ArrowDown,ArrowUp,Eye,EyeOff,Pencil,Trash2,X} from "lucide-react";
import {toast} from "sonner";
import {deleteProduct,reorderProducts,saveProduct,toggleProduct} from "@/app/dashboard/actions";
import type {Category,Product} from "@/lib/types";

function reordered(products:Product[],index:number,delta:number){
  const copy=[...products];const target=index+delta;
  if(target<0||target>=copy.length)return null;
  [copy[index],copy[target]]=[copy[target],copy[index]];
  return copy.map(item=>item.id);
}

export function ProductsManager({categories,products}:{categories:Category[];products:Product[]}){
  const[selected,setSelected]=useState<Product|null>(null);const[busy,start]=useTransition();
  const submit=(form:FormData)=>start(async()=>{try{await saveProduct(form);toast.success(selected?"Producto actualizado":"Producto creado");setSelected(null)}catch(error){toast.error(error instanceof Error?error.message:"No se pudo guardar")}});
  const move=(index:number,delta:number)=>{const ids=reordered(products,index,delta);if(ids)start(async()=>{await reorderProducts(ids);toast.success("Orden actualizado")})};

  return <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
    <form key={selected?.id??"new"} action={submit} className="glass h-fit rounded-2xl p-4">
      <div className="flex items-center justify-between"><h2 className="font-bold">{selected?"Editar producto":"Nuevo producto"}</h2>{selected&&<button type="button" aria-label="Cancelar edición" onClick={()=>setSelected(null)}><X/></button>}</div>
      {selected&&<input type="hidden" name="id" value={selected.id}/>} 
      <label className="mt-3 block text-sm">Nombre<input name="name" required defaultValue={selected?.name??""} className="mt-1 w-full rounded-lg p-3 text-slate-900"/></label>
      <label className="mt-3 block text-sm">Descripción<textarea name="description" defaultValue={selected?.description??""} className="mt-1 min-h-24 w-full rounded-lg p-3 text-slate-900"/></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="mt-3 block text-sm">Precio (€)<input name="price" required min="0" step="0.01" type="number" defaultValue={selected?selected.price_cents/100:""} className="mt-1 w-full rounded-lg p-3 text-slate-900"/></label>
        <label className="mt-3 block text-sm">Categoría<select name="category_id" required defaultValue={selected?.category_id??""} className="mt-1 w-full rounded-lg p-3 text-slate-900"><option value="">Selecciona</option>{categories.map(category=><option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-sm"><label className="flex gap-2"><input name="is_available" defaultChecked={selected?.is_available??true} type="checkbox"/>Disponible</label><label className="flex gap-2"><input name="is_featured" defaultChecked={selected?.is_featured??false} type="checkbox"/>Destacado</label></div>
      <button disabled={busy} className="mt-4 w-full rounded-lg bg-violet-500 px-4 py-3 font-semibold disabled:opacity-50">{busy?"Guardando…":selected?"Guardar cambios":"Crear producto"}</button>
    </form>
    <div className="space-y-3">
      {products.map((product,index)=><article key={product.id} className="glass grid grid-cols-[48px_minmax(0,1fr)] gap-3 rounded-xl p-3">
        <div className="h-16 w-12 overflow-hidden rounded-lg bg-black">{product.video_url?<video src={product.video_url} poster={product.image_url??undefined} muted playsInline preload="metadata" className="h-full w-full object-cover"/>:<div className="grid h-full place-items-center text-[9px] text-slate-500">Sin vídeo</div>}</div>
        <div className="min-w-0 self-center"><h3 className="truncate font-bold">{product.name}</h3><p className="truncate text-xs text-slate-300">{product.categories?.name} · {(product.price_cents/100).toFixed(2)} €</p><p className="mt-1 text-[11px] text-slate-400">{product.is_available?"Disponible":"Oculto"}{product.is_featured?" · Destacado":""}</p></div>
        <div className="col-span-2 flex flex-wrap justify-end border-t border-white/10 pt-1">
          <button disabled={!index||busy} aria-label="Subir producto" onClick={()=>move(index,-1)} className="p-2 disabled:opacity-30"><ArrowUp size={18}/></button>
          <button disabled={index===products.length-1||busy} aria-label="Bajar producto" onClick={()=>move(index,1)} className="p-2 disabled:opacity-30"><ArrowDown size={18}/></button>
          <button aria-label={`Editar ${product.name}`} onClick={()=>setSelected(product)} className="p-2"><Pencil size={18}/></button>
          <button aria-label="Cambiar disponibilidad" onClick={()=>start(async()=>{await toggleProduct(product.id,!product.is_available);toast.success("Disponibilidad actualizada")})} className="p-2">{product.is_available?<Eye size={18}/>:<EyeOff size={18}/>}</button>
          <button aria-label={`Eliminar ${product.name}`} onClick={()=>{if(confirm(`¿Eliminar ${product.name}?`))start(async()=>{try{await deleteProduct(product.id);toast.success("Producto eliminado")}catch(error){toast.error(error instanceof Error?error.message:"Error")}})}} className="p-2 text-red-300"><Trash2 size={18}/></button>
        </div>
      </article>)}
      {!products.length&&<p className="py-8 text-center text-sm text-slate-400">Todavía no hay productos. Añade el primero.</p>}
    </div>
  </div>;
}
