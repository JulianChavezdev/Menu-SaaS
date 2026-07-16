import {Languages,TriangleAlert} from "lucide-react";
import type {TranslationProviderStatus as Status} from "@/lib/automatic-translation";

const number=new Intl.NumberFormat("es-ES");

export function TranslationProviderStatus({provider}:{provider:Status}){
  const ready=provider.status==="ready";
  const percentage=provider.used!==null&&provider.limit?Math.min(100,Math.round(provider.used/provider.limit*100)):null;
  const title=ready?"Traducción automática operativa":provider.status==="not_configured"?"DeepL no está configurado":"DeepL no responde o rechazó la clave";
  const description=ready&&provider.used!==null&&provider.limit!==null?`${number.format(provider.used)} de ${number.format(provider.limit)} caracteres utilizados (${percentage} %).`:ready?"La clave es válida. DeepL no ha comunicado un límite para este plan.":provider.status==="not_configured"?"Añade DEEPL_API_KEY en Vercel para traducir categorías y productos.":"Revisa la clave y el estado de la cuenta antes de editar contenido.";
  return <section className={`mt-5 rounded-xl border bg-white p-4 ${ready?"border-emerald-300":"border-amber-300"}`} aria-label="Estado de traducciones"><div className="flex items-start gap-3">{ready?<Languages className="mt-0.5 shrink-0 text-emerald-700" size={21}/>:<TriangleAlert className="mt-0.5 shrink-0 text-amber-700" size={21}/>}<div className="min-w-0 flex-1"><h2 className="font-bold">{title}</h2><p className="mt-1 text-xs leading-relaxed text-slate-600">{description}</p>{percentage!==null&&<div className="mt-3 h-2 overflow-hidden rounded-sm bg-stone-200" aria-label={`${percentage} % de la cuota utilizado`}><div className={`h-full ${percentage>=90?"bg-red-600":percentage>=70?"bg-amber-600":"bg-emerald-600"}`} style={{width:`${percentage}%`}}/></div>}</div></div></section>;
}
