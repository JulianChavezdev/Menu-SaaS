import {AlertTriangle,Database,Zap} from "lucide-react";
import {capacitySnapshot} from "@/lib/platform-capacity";

export function RestaurantCapacity({current,capacity}:{current:number;capacity:number}){
  const snapshot=capacitySnapshot(current,capacity);
  const colors=snapshot.level==="critical"?"bg-red-500":snapshot.level==="warning"?"bg-amber-400":"bg-emerald-400";
  const panel=snapshot.level==="critical"?"border-red-500/25 bg-red-500/[.07]":snapshot.level==="warning"?"border-amber-400/25 bg-amber-400/[.06]":"border-white/10 bg-slate-950/50";
  const message=snapshot.level==="critical"?`Umbral superado por ${snapshot.exceededBy}. Revisa el plan y el consumo antes de seguir creciendo.`:snapshot.level==="warning"?`Quedan ${snapshot.remaining}. Conviene revisar Storage, transferencia y capacidad de Supabase.`:`Quedan ${snapshot.remaining} plazas dentro del objetivo operativo actual.`;
  return <section aria-labelledby="restaurant-capacity-title" className={`mt-6 rounded-3xl border p-5 ${panel}`}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-slate-400">{snapshot.level==="healthy"?<Database size={17}/>:<AlertTriangle size={17}/>}Capacidad de la plataforma</div><h2 id="restaurant-capacity-title" className="mt-2 text-xl font-bold">{snapshot.current} de {snapshot.capacity} restaurantes</h2><p className="mt-1 text-sm text-slate-400">{message}</p></div>
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-400"><Zap size={15}/>Umbral de planificación, no bloqueo</div>
    </div>
    <div className="mt-5 h-4 overflow-hidden rounded-full border border-white/10 bg-black/35" role="progressbar" aria-label="Restaurantes utilizados" aria-valuemin={0} aria-valuemax={snapshot.capacity} aria-valuenow={Math.min(snapshot.current,snapshot.capacity)} aria-valuetext={`${snapshot.current} de ${snapshot.capacity} restaurantes`}>
      <div className={`h-full rounded-full transition-[width] duration-500 ${colors}`} style={{width:`${snapshot.percent}%`}}/>
    </div>
    <div className="mt-2 flex justify-between text-xs text-slate-500"><span>0</span><strong className="text-slate-300">{snapshot.percent}% utilizado</strong><span>{snapshot.capacity}</span></div>
  </section>;
}
