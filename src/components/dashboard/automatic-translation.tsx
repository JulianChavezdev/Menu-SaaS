"use client";

import {Languages} from "lucide-react";
import {toast} from "sonner";
import type {AutomaticTranslationStatus} from "@/lib/automatic-translation";

export function AutomaticTranslationNote(){return <div className="mt-3 flex gap-2 rounded-xl border border-cyan-400/15 bg-cyan-400/[.05] p-3 text-xs leading-relaxed text-slate-600"><Languages className="mt-0.5 shrink-0 text-cyan-300" size={16}/><span>Escribe el contenido en español. La versión inglesa se genera automáticamente al guardar.</span></div>}

export function notifyAutomaticTranslation(status:AutomaticTranslationStatus){
  if(status==="translated")toast.success("Traducción inglesa actualizada automáticamente");
  else if(status==="not_configured")toast.warning("Contenido guardado. Falta activar el traductor automático.");
  else if(status==="failed")toast.warning("Contenido guardado, pero la traducción no respondió. Puedes reintentarla desde Apariencia.");
}
