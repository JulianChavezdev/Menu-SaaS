import {z} from "zod";

export const analyticsEventSchema=z.object({restaurantId:z.string().uuid(),productId:z.string().uuid().nullable().optional(),event:z.enum(["menu_view","product_view","share","contact_click"]),locale:z.enum(["es","en"]).default("es")}).superRefine((value,context)=>{if(value.event==="product_view"&&!value.productId)context.addIssue({code:"custom",path:["productId"],message:"Product views require a product"})});
export type AnalyticsEvent=z.infer<typeof analyticsEventSchema>;

type AnalyticsRow={event_date:string;event_type:string;event_count:number;dimension_key?:string;product_id?:string|null;products?:{name?:string}|{name?:string}[]|null};

export function summarizeAnalytics(rows:AnalyticsRow[]){
  const totals={menuViews:0,productViews:0,shares:0,contactClicks:0};
  const days=new Map<string,number>();const products=new Map<string,{name:string;views:number}>();
  for(const row of rows){const count=Number(row.event_count)||0;if(row.event_type==="menu_view"){totals.menuViews+=count;days.set(row.event_date,(days.get(row.event_date)??0)+count)}else if(row.event_type==="product_view"){totals.productViews+=count;const productKey=row.product_id??row.dimension_key;if(productKey){const relation=Array.isArray(row.products)?row.products[0]:row.products;const current=products.get(productKey)??{name:relation?.name??"Producto eliminado",views:0};current.views+=count;products.set(productKey,current)}}else if(row.event_type==="share")totals.shares+=count;else if(row.event_type==="contact_click")totals.contactClicks+=count}
  return {totals,days:[...days.entries()].map(([date,views])=>({date,views})).sort((a,b)=>a.date.localeCompare(b.date)),products:[...products.entries()].map(([id,value])=>({id,...value})).sort((a,b)=>b.views-a.views)};
}

export function analyticsDateSeries(days:Array<{date:string;views:number}>,length=14,now=new Date()){
  const values=new Map(days.map(item=>[item.date,item.views]));
  return Array.from({length},(_,index)=>{const date=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()-(length-1-index)));const key=date.toISOString().slice(0,10);return{date:key,views:values.get(key)??0}});
}
