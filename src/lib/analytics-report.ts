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

export function analyticsGuidance(summary:ReturnType<typeof summarizeAnalytics>){
  const {menuViews,productViews,cartAdds}=summary.totals;
  const addRate=productViews?Math.round(cartAdds/productViews*100):0;
  const productsPerVisit=menuViews?productViews/menuViews:0;
  const top=[...summary.products].sort((a,b)=>b.cartAdds-a.cartAdds||b.views-a.views)[0];
  if(!menuViews)return{tone:"attention" as const,title:"Consigue las primeras visitas",explanation:"Todavía no hay aperturas de la carta en este periodo.",action:"Comprueba que esté publicada y coloca o comparte su código QR."};
  if(productsPerVisit<1)return{tone:"attention" as const,title:"Los clientes ven pocos productos",explanation:`Cada visita genera ${productsPerVisit.toFixed(1)} visualizaciones de producto de media.`,action:"Haz más visibles las categorías y coloca primero tus platos más atractivos."};
  if(productViews>=3&&!cartAdds)return{tone:"attention" as const,title:"Hay interés, pero ningún añadido",explanation:`Tus productos se han visto ${productViews} veces, pero todavía no se han añadido al carrito.`,action:"Revisa precios, fotografías, vídeos y el texto del botón de tus productos principales."};
  if(addRate<15)return{tone:"attention" as const,title:"Puedes convertir mejor las visualizaciones",explanation:`Ahora se añaden ${addRate} de cada 100 productos vistos.`,action:`Mejora primero ${top?.name??"el producto más visto"}: portada clara, descripción breve y una recomendación relacionada.`};
  return{tone:"positive" as const,title:"La carta está generando intención de compra",explanation:`Se añaden ${addRate} productos por cada 100 visualizaciones${top?` y ${top.name} destaca sobre el resto`:""}.`,action:"Mantén visible lo que funciona y prueba una mejora cada vez para poder medir su efecto."};
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

export function weeklySalesSummary(summary:ReturnType<typeof summarizeAnalytics>,restaurantName:string){
  const top=[...summary.products].sort((a,b)=>b.cartAdds-a.cartAdds||b.views-a.views)[0];
  const opportunity=[...summary.products].filter(item=>item.views>=3).sort((a,b)=>(b.views-b.cartAdds)-(a.views-a.cartAdds))[0];
  const actions:string[]=[];
  if(!summary.totals.menuViews)actions.push("Comparte el QR de la carta para empezar a recoger actividad.");
  else if(opportunity&&opportunity.addRate<30)actions.push(`Revisa la portada, descripción o precio de ${opportunity.name}.`);
  if(summary.totals.recommendationAdds===0&&summary.totals.cartAdds>0)actions.push("Añade recomendaciones de bebidas, acompañamientos o postres.");
  if(top)actions.push(`Mantén visible ${top.name}: es el producto con mayor intención esta semana.`);
  const lines=[`Resumen semanal de ${restaurantName}`,`${summary.totals.menuViews} visitas a la carta`,`${summary.totals.productViews} productos vistos`,`${summary.totals.cartAdds} añadidos al carrito${summary.totals.recommendationAdds?` (${summary.totals.recommendationAdds} desde recomendaciones)`:""}`,top?`Producto destacado: ${top.name}`:"Aún no hay un producto destacado",`Siguiente acción: ${actions[0]??"Sigue compartiendo la carta y revisa la evolución semanal."}`];
  return{text:lines.join("\n"),actions:actions.slice(0,3),topProduct:top??null};
}
