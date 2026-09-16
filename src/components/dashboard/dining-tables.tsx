"use client";
import {useEffect,useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {toast} from "sonner";
import {QrCard} from "./qr-card";
import {createDiningTable,setDiningTableActive} from "@/app/dashboard/ordering/actions";
import {setTableService} from "@/app/dashboard/ordering/table-service-actions";
type Table={id:string;name:string;public_code:string;is_active:boolean;orders_paused_until:string|null};
export function DiningTables({tables,slug,root,closesAt,enabled,paused,canManage,timezone,backHref="/operaciones/cocina"}:{tables:Table[];slug:string;root:string;closesAt:string|null;enabled:boolean;paused:boolean;canManage:boolean;timezone:string;backHref?:string}){
  const router=useRouter();const[qr,setQr]=useState<Table|null>(null);const[busy,start]=useTransition();
  useEffect(()=>{const timer=setInterval(()=>router.refresh(),30000);return()=>clearInterval(timer)},[router]);
  const perform=(work:()=>Promise<void>)=>start(async()=>{try{await work();router.refresh()}catch(e){toast.error(e instanceof Error?e.message:'No se pudo guardar')}});
  return <main className="workspace-page"><header className="workspace-heading"><div><h1>Mesas y códigos QR</h1><p className="workspace-description">Un QR fijo por mesa. Apertura y cierre automáticos según el horario del restaurante.</p></div><Link href={canManage?'/dashboard/order-settings':backHref} className="workspace-button">{canManage?'Configurar horario':'Volver al servicio'}</Link></header>
    <div className="table-service-banner">{!enabled?'Modo carta: los QR permiten consultar, sin enviar pedidos.':paused?'Nuevos pedidos pausados en todo el restaurante.':closesAt?`Servicio abierto hasta las ${new Intl.DateTimeFormat('es',{hour:'2-digit',minute:'2-digit',timeZone:timezone}).format(new Date(closesAt))}.`:'Fuera de horario. Las mesas se abrirán automáticamente en la próxima franja.'}</div>
    {canManage&&<form className="table-create" action={form=>perform(()=>createDiningTable(form))}><label>Nombre de la mesa<input name="name" required maxLength={40} placeholder="Ej. Terraza 4"/></label><button disabled={busy} className="workspace-button workspace-button-primary">Añadir mesa</button></form>}
    <div className="dining-table-grid">{tables.map(table=>{const manuallyPaused=!!table.orders_paused_until&&new Date(table.orders_paused_until)>new Date();const open=enabled&&!paused&&!!closesAt&&table.is_active&&!manuallyPaused;return <article key={table.id} className="dining-table-card"><div><h2>{table.name}</h2><span data-open={open}>{!table.is_active?'Oculta':!enabled?'Solo carta':open?'Pedidos abiertos':manuallyPaused?'Cerrada por el personal':'Pedidos cerrados'}</span></div><div className="dining-table-actions"><button className="workspace-button" onClick={()=>setQr(qr?.id===table.id?null:table)}>Código QR</button>{enabled&&closesAt&&table.is_active&&<button className="workspace-button" disabled={busy||paused} onClick={()=>perform(()=>setTableService(table.id,!manuallyPaused))}>{manuallyPaused?'Reabrir mesa':'Cerrar esta franja'}</button>}{canManage&&<form action={form=>perform(()=>setDiningTableActive(form))}><input type="hidden" name="table_id" value={table.id}/><input type="hidden" name="active" value={String(!table.is_active)}/><button disabled={busy} className="workspace-button">{table.is_active?'Ocultar mesa':'Mostrar mesa'}</button></form>}</div>{qr?.id===table.id&&<QrCard url={`${root}/r/${slug}?mesa=${table.public_code}`} fileName={`mesa-${table.name.replace(/[^a-z0-9]/gi,'-')}.png`}/>}</article>})}</div>{!tables.length&&<p className="my-10">Añade las mesas del restaurante para generar sus QR.</p>}
  </main>;
}
