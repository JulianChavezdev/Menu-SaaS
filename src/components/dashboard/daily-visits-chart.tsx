"use client";

import {useEffect,useMemo,useRef} from "react";
import {BarChart3} from "lucide-react";

type VisitDay={date:string;views:number};

const dateFormatter=new Intl.DateTimeFormat("es-ES",{day:"2-digit",month:"short",timeZone:"UTC"});
const longDateFormatter=new Intl.DateTimeFormat("es-ES",{weekday:"long",day:"numeric",month:"long",timeZone:"UTC"});
const formatDate=(date:string,formatter:Intl.DateTimeFormat)=>formatter.format(new Date(`${date}T00:00:00Z`)).replace(".","");

export function DailyVisitsChart({series}:{series:VisitDay[]}){
  const scrollRef=useRef<HTMLDivElement>(null);
  const stats=useMemo(()=>{
    const total=series.reduce((sum,item)=>sum+item.views,0);
    const best=series.reduce<VisitDay|null>((current,item)=>!current||item.views>current.views?item:current,null);
    return{total,average:series.length?total/series.length:0,best};
  },[series]);
  const peak=Math.max(1,...series.map(item=>item.views));
  const chartMax=Math.max(4,Math.ceil(peak/4)*4);

  useEffect(()=>{
    const element=scrollRef.current;
    if(element)element.scrollLeft=element.scrollWidth;
  },[series]);

  return <section className="border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-2"><BarChart3 className="text-orange-700" size={20}/><h2 className="font-bold">Visitas diarias</h2></div>
        <p className="mt-1 text-xs text-slate-500">Cada barra representa las aperturas de la carta durante ese día.</p>
      </div>
      <div className="grid grid-cols-3 divide-x divide-stone-200 border border-stone-200 bg-stone-50 text-center">
        <ChartStat label="Total" value={String(stats.total)}/>
        <ChartStat label="Media/día" value={stats.average.toLocaleString("es-ES",{maximumFractionDigits:1})}/>
        <ChartStat label="Máximo" value={String(stats.best?.views??0)}/>
      </div>
    </div>

    <div className="mt-5 flex min-w-0 gap-2">
      <div aria-hidden="true" className="flex h-52 w-7 shrink-0 flex-col justify-between pb-7 text-right text-[10px] tabular-nums text-slate-400">
        {[chartMax,chartMax*.75,chartMax*.5,chartMax*.25,0].map(value=><span key={value}>{Math.round(value)}</span>)}
      </div>
      <div ref={scrollRef} className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-color:#cbd5e1_transparent]">
        <div className="relative h-52" style={{minWidth:`max(100%, ${series.length*42}px)`}}>
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1 bottom-8 flex flex-col justify-between">
            {[0,1,2,3,4].map(line=><span key={line} className="border-t border-dashed border-stone-200"/>)}
          </div>
          <div className="absolute inset-0 flex items-end">
            {series.map(item=><div key={item.date} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end px-1">
              <div className="flex h-[calc(100%-2rem)] w-full flex-col items-center justify-end">
                <span className="mb-1 text-[10px] font-bold tabular-nums text-slate-700">{item.views}</span>
                <div aria-label={`${formatDate(item.date,longDateFormatter)}: ${item.views} visitas`} className="w-full max-w-7 bg-orange-500 transition-colors group-hover:bg-orange-600" style={{height:`${item.views?Math.max(5,item.views/chartMax*100):2}%`,opacity:item.views?1:.18}}/>
              </div>
              <time dateTime={item.date} className="mt-1 h-7 whitespace-nowrap text-[9px] font-medium text-slate-500">{formatDate(item.date,dateFormatter)}</time>
            </div>)}
          </div>
        </div>
      </div>
    </div>
    {stats.best&&<p className="mt-3 border-t border-stone-200 pt-3 text-xs text-slate-600">Mejor día: <strong className="text-slate-900">{formatDate(stats.best.date,longDateFormatter)}</strong> con <strong className="text-slate-900">{stats.best.views} visitas</strong>.</p>}
  </section>;
}

function ChartStat({label,value}:{label:string;value:string}){
  return <div className="min-w-20 px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-0.5 text-lg font-black tabular-nums text-slate-950">{value}</p></div>;
}
