"use client";

import {Copy,Mail,MessageCircle} from "lucide-react";
import {toast} from "sonner";
import {recordPaymentReminder} from "@/app/superadmin/actions";

export function PaymentReminder({restaurantId,restaurantName,phone,email,periodEnd}:{restaurantId:string;restaurantName:string;phone:string|null;email:string|null;periodEnd:string}){
  const date=new Intl.DateTimeFormat("es-ES",{dateStyle:"long"}).format(new Date(periodEnd));
  const message=`Hola, ${restaurantName}. Te recordamos que la suscripción de tu carta vence el ${date}. Cuando realices el pago, envíanos el justificante para mantener activo el servicio. Gracias.`;
  const track=async(channel:"copy"|"whatsapp"|"email")=>{const form=new FormData();form.set("restaurant_id",restaurantId);form.set("channel",channel);form.set("period_end",periodEnd);await recordPaymentReminder(form)};
  const safeTrack=(channel:"whatsapp"|"email")=>void track(channel).catch(()=>toast.error("No se pudo registrar el aviso"));
  const copy=async()=>{try{await navigator.clipboard.writeText(message);await track("copy");toast.success("Aviso copiado")}catch{toast.error("No se pudo copiar el aviso")}};
  const phoneDigits=phone?normalizePhone(phone):"";
  const whatsapp=phoneDigits?`https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`:null;
  const mail=email?`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Recordatorio de suscripción")}&body=${encodeURIComponent(message)}`:null;
  return <div className="mt-4 rounded-xl border border-amber-400/15 bg-amber-400/[.05] p-3"><p className="text-xs font-bold uppercase tracking-wider text-amber-300">Preparar aviso</p><p className="mt-2 text-xs leading-relaxed text-slate-400">{message}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={()=>void copy()} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs"><Copy size={14}/>Copiar</button>{whatsapp&&<a href={whatsapp} target="_blank" rel="noopener noreferrer" onClick={()=>safeTrack("whatsapp")} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold"><MessageCircle size={14}/>WhatsApp</a>}{mail&&<a href={mail} onClick={()=>safeTrack("email")} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold"><Mail size={14}/>Correo</a>}</div></div>;
}

function normalizePhone(phone:string){const digits=phone.replace(/\D/g,"");return digits.length===9?`34${digits}`:digits}
