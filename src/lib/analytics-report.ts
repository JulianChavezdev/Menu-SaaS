import {summarizeAnalytics} from "@/lib/analytics";

export const ANALYTICS_PERIODS=[7,30,90] as const;
export type AnalyticsPeriodDays=typeof ANALYTICS_PERIODS[number];

const dateKey=(date:Date)=>date.toISOString().slice(0,10);

export function parseAnalyticsPeriod(value:unknown):AnalyticsPeriodDays{
  const days=Number(value);return ANALYTICS_PERIODS.includes(days as AnalyticsPeriodDays)?days as AnalyticsPeriodDays:30;
}

export function analyticsPeriodRange(days:AnalyticsPeriodDays,now=new Date()){
  const end=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
  const currentFrom=new Date(end);currentFrom.setUTCDate(currentFrom.getUTCDate()-(days-1));
  const previousTo=new Date(currentFrom);previousTo.setUTCDate(previousTo.getUTCDate()-1);
  const previousFrom=new Date(previousTo);previousFrom.setUTCDate(previousFrom.getUTCDate()-(days-1));
  return{currentFrom:dateKey(currentFrom),currentTo:dateKey(end),previousFrom:dateKey(previousFrom),previousTo:dateKey(previousTo)};
}

export function analyticsChange(current:number,previous:number){
  if(previous===0)return current===0?{label:"0%",tone:"flat" as const}:{label:"Nuevo",tone:"up" as const};
  const value=Math.round((current-previous)/previous*100);return{label:`${value>0?"+":""}${value}%`,tone:value>0?"up" as const:value<0?"down" as const:"flat" as const};
}

const csvCell=(value:unknown)=>{let text=String(value??"");if(/^[=+\-@]/.test(text.trimStart()))text=`'${text}`;return`"${text.replaceAll('"','""')}"`};

export function analyticsReportCsv(summary:ReturnType<typeof summarizeAnalytics>,restaurantName:string,days:number){
  const rows:Array<unknown[]>=[
    ["Informe comercial",restaurantName],["Periodo",`${days} días`],["Visitas",summary.totals.menuViews],["Productos vistos",summary.totals.productViews],["Vídeos iniciados",summary.totals.videoPlays],["Detalles abiertos",summary.totals.detailOpens],["Añadidos al carrito",summary.totals.cartAdds],["Añadidos por recomendación",summary.totals.recommendationAdds],[],
    ["Producto","Categoría","Vistas","Vídeos","Detalles","Añadidos","Añadidos sugeridos","Tasa de añadido"],
    ...summary.products.map(item=>[item.name,item.categoryName,item.views,item.videoPlays,item.detailOpens,item.cartAdds,item.recommendationAdds,`${item.addRate}%`]),
  ];
  return `\uFEFF${rows.map(row=>row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}
