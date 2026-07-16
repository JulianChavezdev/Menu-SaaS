import {CalendarClock,ChartNoAxesColumnIncreasing,TrendingDown,TrendingUp} from "lucide-react";
import {platformGrowth} from "@/lib/platform-growth";

export function PlatformGrowth({createdAt,capacity}:{createdAt:string[];capacity:number}){
  const growth=platformGrowth(createdAt,capacity);
  const peak=Math.max(1,...growth.months.map(month=>month.added));
  const projection=growth.projectedDate?new Intl.DateTimeFormat("es-ES",{month:"long",year:"numeric"}).format(new Date(growth.projectedDate)):"Sin fecha estimada";
  const status=growth.monthsToCapacity===0?"El umbral ya está alcanzado.":growth.monthsToCapacity===null?"Todavía no hay crecimiento suficiente para proyectar el límite.":`Al ritmo de los últimos 90 días, el umbral se alcanzaría aproximadamente en ${projection}.`;
  return <section aria-labelledby="growth-title" className="mt-6 rounded-3xl border border-stone-200 bg-white p-5">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-orange-700">Tendencia de altas</p><h2 id="growth-title" className="mt-1 text-xl font-bold">Crecimiento de restaurantes</h2><p className="mt-1 text-sm text-slate-600">{status}</p></div><div className="flex items-center gap-2 text-sm font-semibold text-slate-700">{growth.trend>=0?<TrendingUp className="text-emerald-800" size={18}/>:<TrendingDown className="text-amber-800" size={18}/>} {growth.trend>=0?"+":""}{growth.trend} frente a los 30 días anteriores</div></div>
    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,.5fr)]">
      <div aria-label="Altas mensuales" className="flex h-44 items-end gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-3 pb-3 pt-6">{growth.months.map(month=><div key={month.key} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><strong className="text-xs tabular-nums">{month.added}</strong><div title={`${month.label}: ${month.added} altas`} className="w-full max-w-14 rounded-t-lg bg-orange-500" style={{height:`${Math.max(4,month.added/peak*105)}px`,opacity:month.added?1:.18}}/><span className="text-[10px] capitalize text-slate-500">{month.label}</span></div>)}</div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1"><GrowthMetric icon={<ChartNoAxesColumnIncreasing/>} label="Altas 30 días" value={`+${growth.last30}`}/><GrowthMetric icon={<TrendingUp/>} label="Media mensual 90d" value={growth.monthlyRate.toLocaleString("es-ES")}/><GrowthMetric icon={<CalendarClock/>} label="Meses hasta objetivo" value={growth.monthsToCapacity===null?"—":growth.monthsToCapacity.toLocaleString("es-ES")}/></div>
    </div>
  </section>;
}

function GrowthMetric({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3"><div className="flex items-center gap-2 text-[10px] uppercase text-slate-500">{icon}{label}</div><p className="mt-2 text-2xl font-black tabular-nums">{value}</p></div>}
