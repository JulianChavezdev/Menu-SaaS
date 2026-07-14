import {Activity,HardDrive,Play,Radio} from "lucide-react";
import {resourceSnapshot} from "@/lib/platform-capacity";

export type PlatformResourceMetrics={storageBytes:number;videoBytes:number;logoBytes:number;storageObjects:number;uploadedVideos:number;uploadedLogos:number};

function formatBytes(bytes:number){
  if(bytes<=0)return "0 MB";
  const units=["B","KB","MB","GB","TB"];
  const index=Math.min(Math.floor(Math.log(bytes)/Math.log(1024)),units.length-1);
  return `${new Intl.NumberFormat("es-ES",{maximumFractionDigits:index>=3?2:1}).format(bytes/1024**index)} ${units[index]}`;
}

export function PlatformResourceUsage({metrics,storageCapacityGb,menuViews,productViews,hostedVideoViews}:{metrics:PlatformResourceMetrics|null;storageCapacityGb:number;menuViews:number;productViews:number;hostedVideoViews:number}){
  if(!metrics)return <section className="mt-6 rounded-3xl border border-dashed border-amber-400/30 bg-amber-400/[.05] p-5"><div className="flex items-center gap-2 font-bold text-amber-200"><Activity size={19}/>Medición de recursos pendiente</div><p className="mt-2 text-sm text-slate-400">Aplica la última migración para medir Storage. Las analíticas continúan funcionando con normalidad.</p></section>;
  const snapshot=resourceSnapshot({...metrics,hostedVideoViews,storageCapacityGb});
  const storageTone=snapshot.storagePercent>=90?"bg-red-500":snapshot.storagePercent>=75?"bg-amber-400":"bg-cyan-400";
  return <section aria-labelledby="platform-resources-title" className="mt-6 rounded-3xl border border-white/10 bg-slate-950/50 p-5">
    <div><p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-300">Últimos 30 días y estado actual</p><h2 id="platform-resources-title" className="mt-1 text-xl font-bold">Consumo de recursos</h2><p className="mt-1 text-sm text-slate-400">Storage es una medición real. La transferencia se estima suponiendo una reproducción completa por visualización.</p></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Resource icon={<HardDrive/>} label="Storage usado" value={formatBytes(metrics.storageBytes)} detail={`${metrics.storageObjects} archivos · límite ${storageCapacityGb} GB`}/>
      <Resource icon={<Play/>} label="Vídeos propios vistos" value={hostedVideoViews.toLocaleString("es-ES")} detail={`${productViews.toLocaleString("es-ES")} vistas de producto totales`}/>
      <Resource icon={<Radio/>} label="Transferencia estimada" value={formatBytes(snapshot.estimatedTransferBytes)} detail={`Vídeo medio ${formatBytes(snapshot.averageVideoBytes)}`}/>
      <Resource icon={<Activity/>} label="Visitas a cartas" value={menuViews.toLocaleString("es-ES")} detail="Contadores agregados, sin rastreo personal"/>
    </div>
    <div className="mt-5"><div className="mb-2 flex items-center justify-between text-xs"><span className="text-slate-400">Ocupación de Storage</span><strong>{snapshot.storagePercent}%</strong></div><div role="progressbar" aria-label="Storage utilizado" aria-valuemin={0} aria-valuemax={100} aria-valuenow={snapshot.storagePercent} className="h-3 overflow-hidden rounded-full bg-black/40"><div className={`h-full rounded-full ${storageTone}`} style={{width:`${snapshot.storagePercent}%`}}/></div><p className="mt-2 text-xs text-slate-500">{metrics.uploadedVideos} vídeos ({formatBytes(metrics.videoBytes)}) · {metrics.uploadedLogos} logos ({formatBytes(metrics.logoBytes)})</p></div>
  </section>;
}

function Resource({icon,label,value,detail}:{icon:React.ReactNode;label:string;value:string;detail:string}){return <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-center gap-2 text-xs uppercase text-slate-500">{icon}{label}</div><p className="mt-3 text-2xl font-black tabular-nums">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>}
