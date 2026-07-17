import {z} from "zod";

export const analyticsEventSchema=z.object({restaurantId:z.string().uuid(),productId:z.string().uuid().nullable().optional(),event:z.enum(["menu_view","product_view","video_play","detail_open","cart_add","recommendation_add","share","contact_click"]),locale:z.enum(["es","en"]).default("es")}).superRefine((value,context)=>{if(["product_view","video_play","detail_open","cart_add","recommendation_add"].includes(value.event)&&!value.productId)context.addIssue({code:"custom",path:["productId"],message:"Product events require a product"})});
export type AnalyticsEvent=z.infer<typeof analyticsEventSchema>;

type ProductRelation={name?:string;category_id?:string;categories?:{name?:string}|{name?:string}[]|null};
type AnalyticsRow={event_date:string;event_type:string;event_count:number;dimension_key?:string;product_id?:string|null;products?:ProductRelation|ProductRelation[]|null};

type ProductMetrics={name:string;categoryId:string;categoryName:string;views:number;videoPlays:number;detailOpens:number;cartAdds:number;recommendationAdds:number};

export function summarizeAnalytics(rows:AnalyticsRow[]){
  const totals={menuViews:0,productViews:0,videoPlays:0,detailOpens:0,cartAdds:0,recommendationAdds:0,shares:0,contactClicks:0};
  const days=new Map<string,number>();const products=new Map<string,ProductMetrics>();
  for(const row of rows){
    const count=Number(row.event_count)||0;
    if(row.event_type==="menu_view"){totals.menuViews+=count;days.set(row.event_date,(days.get(row.event_date)??0)+count);continue}
    if(row.event_type==="share"){totals.shares+=count;continue}if(row.event_type==="contact_click"){totals.contactClicks+=count;continue}
    if(row.event_type==="product_view")totals.productViews+=count;else if(row.event_type==="video_play")totals.videoPlays+=count;else if(row.event_type==="detail_open")totals.detailOpens+=count;else if(row.event_type==="cart_add")totals.cartAdds+=count;else if(row.event_type==="recommendation_add")totals.recommendationAdds+=count;
    const productKey=row.product_id??row.dimension_key;if(!productKey)continue;
    const relation=Array.isArray(row.products)?row.products[0]:row.products;const category=Array.isArray(relation?.categories)?relation?.categories[0]:relation?.categories;
    const current=products.get(productKey)??{name:relation?.name??"Producto eliminado",categoryId:relation?.category_id??"unknown",categoryName:category?.name??"Sin categoría",views:0,videoPlays:0,detailOpens:0,cartAdds:0,recommendationAdds:0};
    if(row.event_type==="product_view")current.views+=count;else if(row.event_type==="video_play")current.videoPlays+=count;else if(row.event_type==="detail_open")current.detailOpens+=count;else if(row.event_type==="cart_add")current.cartAdds+=count;else if(row.event_type==="recommendation_add")current.recommendationAdds+=count;
    products.set(productKey,current);
  }
  const productList=[...products.entries()].map(([id,value])=>({...value,id,addRate:value.views?Math.round(value.cartAdds/value.views*100):0})).sort((a,b)=>b.views-a.views);
  const categories=new Map<string,{name:string;views:number;cartAdds:number}>();for(const item of productList){const current=categories.get(item.categoryId)??{name:item.categoryName,views:0,cartAdds:0};current.views+=item.views;current.cartAdds+=item.cartAdds;categories.set(item.categoryId,current)}
  return {totals,days:[...days.entries()].map(([date,views])=>({date,views})).sort((a,b)=>a.date.localeCompare(b.date)),products:productList,categories:[...categories.entries()].map(([id,value])=>({id,...value,addRate:value.views?Math.round(value.cartAdds/value.views*100):0})).sort((a,b)=>b.cartAdds-a.cartAdds)};
}

export function analyticsDateSeries(days:Array<{date:string;views:number}>,length=14,now=new Date()){
  const values=new Map(days.map(item=>[item.date,item.views]));
  return Array.from({length},(_,index)=>{const date=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()-(length-1-index)));const key=date.toISOString().slice(0,10);return{date:key,views:values.get(key)??0}});
}
