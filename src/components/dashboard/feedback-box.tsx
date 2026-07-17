"use client";

import {useRef,useTransition} from "react";
import {MessageSquareText,Send} from "lucide-react";
import {toast} from "sonner";
import {submitRestaurantFeedback} from "@/app/dashboard/actions";

export function FeedbackBox(){
  const formRef=useRef<HTMLFormElement>(null);const[busy,start]=useTransition();
  return <section className="mt-6 border border-stone-200 bg-white p-5 shadow-sm md:p-7">
    <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center bg-orange-100 text-orange-700"><MessageSquareText size={20}/></span><div><h2 className="font-bold">Ayúdanos a mejorar</h2><p className="mt-1 text-sm text-slate-600">Cuéntanos qué te gusta y qué añadirías, quitarías o mejorarías.</p></div></div>
    <form ref={formRef} action={form=>start(async()=>{try{await submitRestaurantFeedback(form);formRef.current?.reset();toast.success("Comentario enviado. Gracias por ayudarnos a mejorar.")}catch(error){toast.error(error instanceof Error?error.message:"No se pudo enviar el comentario")}})} className="mt-5 grid gap-4">
      <label className="text-sm font-semibold">Tipo de comentario<select name="category" defaultValue="improvement" className="mt-1.5 w-full border border-stone-300 bg-white p-3 font-normal text-slate-900"><option value="improvement">Algo que mejorar</option><option value="feature">Función que te gustaría</option><option value="problem">Un problema</option><option value="remove">Algo que quitar</option><option value="other">Otro</option></select></label>
      <label className="text-sm font-semibold">Tu comentario<textarea name="message" required minLength={10} maxLength={2000} placeholder="Escribe aquí qué te gusta, qué añadirías, quitarías o mejorarías…" className="mt-1.5 min-h-32 w-full resize-y border border-stone-300 bg-white p-3 font-normal text-slate-900 placeholder:text-slate-400"/></label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">Tu mensaje es privado: solo lo verá el equipo de Carta Video.</p><button disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 bg-orange-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-700 disabled:opacity-50"><Send size={16}/>{busy?"Enviando…":"Enviar sugerencia"}</button></div>
    </form>
  </section>;
}
