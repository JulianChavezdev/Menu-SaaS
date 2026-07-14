"use client";

import {useMemo,useState} from "react";
import Link from "next/link";
import {Search} from "lucide-react";
import type {ManualBillingState} from "@/lib/manual-billing";

export type ManagedRestaurant={id:string;name:string;slug:string;isPublished:boolean;isSuspended:boolean;status:string;template:string;products:number;categories:number;members:number;createdAt:string;paymentProvider:string|null;periodEnd:string|null;billingState:ManualBillingState};

export function RestaurantsTable({restaurants}:{restaurants:ManagedRestaurant[]}){
  const[query,setQuery]=useState("");
  const[filter,setFilter]=useState<"all"|"active"|"due"|"suspended">("all");
  const visible=useMemo(()=>restaurants.filter(item=>{const matches=`${item.name} ${item.slug}`.toLowerCase().includes(query.toLowerCase());const matchesFilter=filter==="all"||(filter==="suspended"?item.isSuspended:filter==="due"?(item.billingState==="due_soon"||item.billingState==="overdue"):!item.isSuspended);return matches&&matchesFilter}),[restaurants,query,filter]);
  return <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/50">
    <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between"><label className="relative block flex-1"><Search className="pointer-events-none absolute left-3 top-3 text-slate-500" size={18}/><span className="sr-only">Buscar restaurantes</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Buscar por nombre o slug" className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-10 pr-3"/></label><select aria-label="Filtrar restaurantes" value={filter} onChange={event=>setFilter(event.target.value as typeof filter)} className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5"><option value="all">Todos</option><option value="active">Con acceso</option><option value="due">Pago por revisar</option><option value="suspended">Suspendidos</option></select></div>
    <div className="divide-y divide-white/10">{visible.map(item=><article key={item.id} className="grid gap-4 p-4 transition hover:bg-white/[.03] md:grid-cols-[minmax(0,1.5fr)_repeat(3,90px)_140px_auto] md:items-center">
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-bold">{item.name}</h2>{item.isSuspended?<span className="rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-bold uppercase text-red-300">Suspendido</span>:<span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${item.isPublished?"bg-emerald-500/15 text-emerald-300":"bg-amber-500/15 text-amber-300"}`}>{item.isPublished?"Publicado":"Borrador"}</span>}</div><p className="mt-1 truncate text-xs text-slate-500">/{item.slug} · {new Intl.DateTimeFormat("es-ES",{dateStyle:"medium"}).format(new Date(item.createdAt))}</p></div>
      <Stat label="Productos" value={item.products}/><Stat label="Categorías" value={item.categories}/><Stat label="Miembros" value={item.members}/>
      <div><p className="text-xs text-slate-500">Suscripción</p><p className="mt-1 text-sm font-semibold capitalize">{item.status}</p><BillingLabel state={item.billingState} provider={item.paymentProvider} periodEnd={item.periodEnd}/></div>
      <Link href={`/superadmin/restaurants/${item.id}`} className="rounded-xl bg-violet-600 px-4 py-2 text-center text-sm font-semibold hover:bg-violet-500">Gestionar</Link>
    </article>)}{!visible.length&&<p className="p-8 text-center text-sm text-slate-500">No hay restaurantes con este filtro.</p>}</div>
  </section>;
}

function Stat({label,value}:{label:string;value:number}){return <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-bold tabular-nums">{value}</p></div>}
function BillingLabel({state,provider,periodEnd}:{state:ManualBillingState;provider:string|null;periodEnd:string|null}){if(!periodEnd)return <p className="text-[10px] text-slate-500">Sin vencimiento</p>;const label=state==="overdue"?"Vencido":state==="due_soon"?"Vence pronto":`Hasta ${new Intl.DateTimeFormat("es-ES",{dateStyle:"short"}).format(new Date(periodEnd))}`;return <p className={`text-[10px] ${state==="overdue"?"text-red-300":state==="due_soon"?"text-amber-300":"text-slate-500"}`}>{provider==="manual"?"Manual · ":""}{label}</p>}
