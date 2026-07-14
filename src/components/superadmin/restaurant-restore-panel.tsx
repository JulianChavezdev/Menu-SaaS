"use client";

import {ChangeEvent,useState} from "react";
import {Download,FileUp,History,Plus,RefreshCcw,ShieldCheck,Trash2} from "lucide-react";

const MAX_BACKUP_BYTES=5*1024*1024;

type Preview={
  exportedAt:string;sourceName:string;changedSettings:string[];mediaReferences:number;canApply:boolean;warnings:string[];
  categories:{current:number;backup:number;added:number;removed:number};
  products:{current:number;backup:number;added:number;removed:number};
};
type StoredBackup={id:string;reason:"daily"|"manual"|"pre_restore";category_count:number;product_count:number;created_at:string};
const reasonLabel={daily:"Diaria",manual:"Manual",pre_restore:"Antes de restaurar"};

export function RestaurantRestorePanel({restaurantId,restaurantSlug,backups}:{restaurantId:string;restaurantSlug:string;backups:StoredBackup[]}){
  const[backup,setBackup]=useState<unknown>();
  const[preview,setPreview]=useState<Preview>();
  const[confirmation,setConfirmation]=useState("");
  const[error,setError]=useState("");
  const[busy,setBusy]=useState(false);
  const[restored,setRestored]=useState(false);
  const[pendingDelete,setPendingDelete]=useState("");

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

  async function createBackup(){
    setBusy(true);setError("");
    try{const result=await fetch(`/api/superadmin/restaurants/${restaurantId}/backups`,{method:"POST"});const data=await result.json();if(!result.ok)throw new Error(data.error);window.location.reload()}
    catch(caught){setError(caught instanceof Error?caught.message:"No se pudo crear la copia.")}
    finally{setBusy(false)}
  }

  async function loadStoredBackup(backupId:string){
    setBusy(true);setError("");setPreview(undefined);setBackup(undefined);setConfirmation("");
    try{const result=await fetch(`/api/superadmin/restaurants/${restaurantId}/backups/${backupId}`);const data=await result.json();if(!result.ok)throw new Error(data.error);const checked=await request("preview",data.backup);setBackup(data.backup);setPreview(checked.preview)}
    catch(caught){setError(caught instanceof Error?caught.message:"No se pudo abrir la copia.")}
    finally{setBusy(false)}
  }

  async function deleteBackup(backupId:string){
    if(pendingDelete!==backupId){setPendingDelete(backupId);return}
    setBusy(true);setError("");
    try{const result=await fetch(`/api/superadmin/restaurants/${restaurantId}/backups/${backupId}`,{method:"DELETE"});const data=await result.json();if(!result.ok)throw new Error(data.error);window.location.reload()}
    catch(caught){setError(caught instanceof Error?caught.message:"No se pudo eliminar la copia.")}
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
    <button type="button" onClick={createBackup} disabled={busy} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold disabled:opacity-50"><Plus size={17}/>Crear punto ahora</button>
    <details className="mt-3 rounded-xl border border-white/10 bg-slate-950/40 p-3"><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold"><span className="inline-flex items-center gap-2"><History size={16}/>Historial privado</span><span className="text-xs text-slate-500">{backups.length}</span></summary><div className="mt-3 space-y-2">{backups.map(item=><div key={item.id} className="rounded-lg border border-white/10 p-2"><div className="flex items-start justify-between gap-2"><button type="button" onClick={()=>loadStoredBackup(item.id)} disabled={busy} className="min-w-0 text-left"><span className="block text-xs font-bold text-amber-200">{reasonLabel[item.reason]}</span><span className="block text-[11px] text-slate-500">{new Intl.DateTimeFormat("es-ES",{dateStyle:"short",timeStyle:"short"}).format(new Date(item.created_at))} · {item.product_count} productos</span></button><div className="flex shrink-0 gap-1"><a href={`/api/superadmin/restaurants/${restaurantId}/backups/${item.id}?download=1`} title="Descargar copia" className="rounded-md p-2 hover:bg-white/10"><Download size={14}/></a><button type="button" onClick={()=>deleteBackup(item.id)} title={pendingDelete===item.id?"Confirmar eliminación":"Eliminar copia"} className={`rounded-md p-2 ${pendingDelete===item.id?"bg-red-600 text-white":"hover:bg-red-500/10 hover:text-red-300"}`}><Trash2 size={14}/></button></div></div>{pendingDelete===item.id&&<p className="mt-1 text-[10px] text-red-300">Pulsa otra vez para eliminarla.</p>}</div>)}{!backups.length&&<p className="text-xs text-slate-500">Todavía no hay copias guardadas.</p>}</div></details>
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
