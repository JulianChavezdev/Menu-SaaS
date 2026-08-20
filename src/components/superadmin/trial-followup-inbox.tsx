"use client";

import Link from "next/link";
import {Copy,ExternalLink,Mail,MessageCircle} from "lucide-react";
import {useState} from "react";
import {toast} from "sonner";
import {recordTrialFollowup} from "@/app/superadmin/actions";
import {paymentReminderChannelLabel,paymentReminderLinks,trialFollowupMessage,type PaymentReminderChannel} from "@/lib/payment-reminders";
import {trialDaysRemaining} from "@/lib/signup-plans";
import {SalesStatusForm} from "@/components/superadmin/sales-status-form";
import type {SalesStage} from "@/lib/sales-stages";

export type TrialFollowupItem={restaurantId:string;restaurantName:string;planName:string;phone:string|null;email:string|null;periodEnd:string;salesStage:SalesStage;salesNote:string;lastContact:{createdAt:string;channel:PaymentReminderChannel}|null};

export function TrialFollowupInbox({items}:{items:TrialFollowupItem[]}){return <section className="mt-6 border border-stone-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-[.16em] text-orange-700">Seguimiento individual</p><h2 className="mt-1 text-xl font-bold">Restaurantes en prueba</h2><p className="mt-1 text-sm text-slate-600">Prepara el contacto y registra la acción. Menuly nunca enviará el mensaje automáticamente.</p><div className="mt-4 grid gap-3 xl:grid-cols-2">{items.map(item=><TrialCard key={item.restaurantId} item={item}/>)}{!items.length&&<p className="border border-dashed border-stone-300 p-8 text-center text-sm text-slate-500 xl:col-span-2">No hay pruebas activas.</p>}</div></section>}

function TrialCard({item}:{item:TrialFollowupItem}){
  const[contact,setContact]=useState(item.lastContact);const days=trialDaysRemaining(item.periodEnd);const message=trialFollowupMessage({...item,daysRemaining:days});const links=paymentReminderLinks({message,phone:item.phone,email:item.email,subject:"Seguimiento de tu prueba de Menuly"});
  const track=async(channel:PaymentReminderChannel)=>{const form=new FormData();form.set("restaurant_id",item.restaurantId);form.set("channel",channel);form.set("period_end",item.periodEnd);await recordTrialFollowup(form);setContact({createdAt:new Date().toISOString(),channel})};
  const copy=async()=>{try{await navigator.clipboard.writeText(message);await track("copy");toast.success("Mensaje copiado y seguimiento registrado")}catch{toast.error("No se pudo copiar el mensaje")}};
  const link=(channel:"whatsapp"|"email")=>void track(channel).catch(()=>toast.error("Se abrió el contacto, pero no pudo registrarse"));
  return <article className={`border p-4 ${days<=7?"border-amber-300 bg-amber-50/60":"border-stone-200 bg-stone-50"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-bold">{item.restaurantName}</h3><p className="mt-1 text-xs text-slate-600">{item.planName}</p></div><span className={`shrink-0 px-2 py-1 text-[10px] font-bold uppercase ${days<=3?"bg-orange-700 text-white":days<=7?"bg-amber-200 text-amber-950":"bg-emerald-100 text-emerald-800"}`}>{days===0?"Termina hoy":`${days} días`}</span></div><p className="mt-3 bg-white p-3 text-xs leading-relaxed text-slate-600">{message}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={()=>void copy()} className="inline-flex items-center gap-1.5 border border-stone-300 px-3 py-2 text-xs"><Copy size={14}/>Copiar</button>{links.whatsapp&&<a href={links.whatsapp} target="_blank" rel="noreferrer" onClick={()=>link("whatsapp")} className="inline-flex items-center gap-1.5 bg-emerald-700 px-3 py-2 text-xs font-bold text-white"><MessageCircle size={14}/>WhatsApp</a>}{links.email&&<a href={links.email} onClick={()=>link("email")} className="inline-flex items-center gap-1.5 bg-orange-600 px-3 py-2 text-xs font-bold text-white"><Mail size={14}/>Correo</a>}<Link href={`/superadmin/restaurants/${item.restaurantId}`} className="inline-flex items-center gap-1.5 border border-stone-300 px-3 py-2 text-xs font-bold"><ExternalLink size={14}/>Gestionar</Link></div><p className="mt-3 text-[11px] text-slate-500">{contact?`Último contacto preparado por ${paymentReminderChannelLabel(contact.channel)} · ${new Intl.DateTimeFormat("es-ES",{dateStyle:"medium",timeStyle:"short"}).format(new Date(contact.createdAt))}`:"Sin contacto preparado todavía."}</p>{!links.whatsapp&&!links.email&&<p className="mt-1 text-[11px] text-amber-800">Falta teléfono o correo; aún puedes copiar el mensaje.</p>}<SalesStatusForm restaurantId={item.restaurantId} stage={item.salesStage} note={item.salesNote} compact/></article>;
}
