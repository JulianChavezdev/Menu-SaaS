"use client";

import {ChangeEvent,useState} from "react";
import {FileUp,RefreshCcw,ShieldCheck} from "lucide-react";

const MAX_BACKUP_BYTES=5*1024*1024;

type Preview={
  exportedAt:string;sourceName:string;changedSettings:string[];mediaReferences:number;canApply:boolean;warnings:string[];
  categories:{current:number;backup:number;added:number;removed:number};
  products:{current:number;backup:number;added:number;removed:number};
};

export function RestaurantRestorePanel({restaurantId,restaurantSlug}:{restaurantId:string;restaurantSlug:string}){
  const[backup,setBackup]=useState<unknown>();
  const[preview,setPreview]=useState<Preview>();
  const[confirmation,setConfirmation]=useState("");
  const[error,setError]=useState("");
  const[busy,setBusy]=useState(false);
  const[restored,setRestored]=useState(false);

  async function request(mode:"preview"|"apply",document:unknown){
    const result=await fetch(`/api/superadmin/restaurants/${restaurantId}/restore?mode=${mode}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({backup:document,confirmation})});
    const data=await result.json().catch(()=>({error:"Respuesta no válida del servidor."}));
    if(!result.ok)throw new Error(data.error??"No se pudo procesar la copia.");
    return data;
  }

  async function selectFile(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];
    setError("");setPreview(undefined);setBackup(undefined);setConfirmation("");setRestored(false);
    if(!file)return;
    if(file.size>MAX_BACKUP_BYTES){setError("El archivo supera el máximo de 5 MB.");return}
    setBusy(true);
    try{
      const document=JSON.parse(await file.text());
      const data=await request("preview",document);
      setBackup(document);setPreview(data.preview);
    }catch(caught){setError(caught instanceof Error?caught.message:"La copia no es válida.")}
    finally{setBusy(false)}
  }

  async function applyRestore(){
    if(!backup||!preview?.canApply||confirmation!==restaurantSlug)return;
    setBusy(true);setError("");
    try{await request("apply",backup);setRestored(true);setPreview(undefined);setBackup(undefined);setConfirmation("");window.location.reload()}
    catch(caught){setError(caught instanceof Error?caught.message:"No se pudo restaurar la copia.")}
    finally{setBusy(false)}
  }

  return <section className="rounded-3xl border border-amber-400/20 bg-amber-400/[.04] p-5">
    <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-amber-300"/><h2 className="font-bold">Restaurar copia</h2></div>
    <p className="mt-2 text-xs leading-relaxed text-slate-400">Primero se genera una vista previa. Ningún dato cambia hasta confirmar con el slug del restaurante.</p>
    <label className="mt-4 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-amber-300/30 px-3 py-3 text-center text-sm font-semibold hover:bg-amber-300/5">
      <FileUp size={17}/>{busy?"Comprobando…":"Seleccionar copia JSON"}<input type="file" accept="application/json,.json" className="sr-only" onChange={selectFile} disabled={busy}/>
    </label>
    {error&&<p role="alert" className="mt-3 rounded-xl bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}
    {restored&&<p className="mt-3 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-300">Copia restaurada correctamente.</p>}
    {preview&&<div className="mt-4 space-y-4">
      <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3"><p className="text-sm font-bold">{preview.sourceName}</p><p className="mt-1 text-xs text-slate-500">Copia del {new Intl.DateTimeFormat("es-ES",{dateStyle:"medium",timeStyle:"short"}).format(new Date(preview.exportedAt))}</p></div>
      <div className="grid grid-cols-2 gap-2"><Difference label="Categorías" value={preview.categories}/><Difference label="Productos" value={preview.products}/></div>
      <p className="text-xs text-slate-400">{preview.changedSettings.length} ajustes cambiarán · {preview.mediaReferences} referencias de medios</p>
      <ul className="space-y-1 text-xs text-amber-200/80">{preview.warnings.map(warning=><li key={warning}>• {warning}</li>)}</ul>
      {preview.canApply&&<><label className="block text-xs font-medium text-slate-300">Escribe <strong>{restaurantSlug}</strong> para confirmar<input value={confirmation} onChange={event=>setConfirmation(event.target.value)} autoComplete="off" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-sm"/></label><button type="button" onClick={applyRestore} disabled={busy||confirmation!==restaurantSlug} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"><RefreshCcw size={17}/>{busy?"Restaurando…":"Aplicar restauración"}</button></>}
    </div>}
  </section>;
}

function Difference({label,value}:{label:string;value:Preview["categories"]}){return <div className="rounded-xl bg-white/[.04] p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-bold">{value.current} → {value.backup}</p><p className="text-[11px] text-slate-500">+{value.added} · −{value.removed}</p></div>}
