"use client";

import {Copy,Mail,MessageCircle} from "lucide-react";
import {toast} from "sonner";
import {recordPaymentReminder} from "@/app/superadmin/actions";
import {paymentReminderLinks,paymentReminderMessage,type PaymentReminderChannel} from "@/lib/payment-reminders";

export function PaymentReminder({restaurantId,restaurantName,phone,email,periodEnd}:{restaurantId:string;restaurantName:string;phone:string|null;email:string|null;periodEnd:string}){
  const message=paymentReminderMessage({restaurantName,periodEnd});
  const track=async(channel:PaymentReminderChannel)=>{const form=new FormData();form.set("restaurant_id",restaurantId);form.set("channel",channel);form.set("period_end",periodEnd);await recordPaymentReminder(form)};
  const safeTrack=(channel:"whatsapp"|"email")=>void track(channel).catch(()=>toast.error("No se pudo registrar el aviso"));
  const copy=async()=>{try{await navigator.clipboard.writeText(message);await track("copy");toast.success("Aviso copiado")}catch{toast.error("No se pudo copiar el aviso")}};
  const {whatsapp,email:mail}=paymentReminderLinks({message,phone,email});
  return <div className="mt-4 rounded-xl border border-amber-400/15 bg-amber-400/[.05] p-3"><p className="text-xs font-bold uppercase tracking-wider text-amber-800">Preparar aviso</p><p className="mt-2 text-xs leading-relaxed text-slate-600">{message}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={()=>void copy()} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-xs"><Copy size={14}/>Copiar</button>{whatsapp&&<a href={whatsapp} target="_blank" rel="noopener noreferrer" onClick={()=>safeTrack("whatsapp")} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold"><MessageCircle size={14}/>WhatsApp</a>}{mail&&<a href={mail} onClick={()=>safeTrack("email")} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold"><Mail size={14}/>Correo</a>}</div></div>;
}
