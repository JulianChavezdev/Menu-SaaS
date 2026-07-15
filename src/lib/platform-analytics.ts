export const analyticsPeriods=["7","30","90","365","all"] as const;
export type AnalyticsPeriod=typeof analyticsPeriods[number];
export type AnalyticsRelation<T>=T|T[]|null;
export type PlatformAnalyticsRow={event_date:string;event_type:string;event_count:number;restaurant_id:string;product_id:string|null;locale:string;restaurants:AnalyticsRelation<{name:string;slug:string}>;products:AnalyticsRelation<{name:string;video_url?:string|null;video_path?:string|null}>};

function relation<T>(value:AnalyticsRelation<T>){return Array.isArray(value)?value[0]??null:value}
function percentage(value:number,total:number){return total?Math.round(value/total*1000)/10:0}
function ratio(value:number,total:number){return total?Math.round(value/total*100)/100:0}

export function analyticsPeriodStart(period:unknown,now=new Date()){
  const normalized:AnalyticsPeriod=analyticsPeriods.includes(period as AnalyticsPeriod)?period as AnalyticsPeriod:"30";if(normalized==="all")return{period:normalized,from:null};const date=new Date(now);date.setUTCDate(date.getUTCDate()-(Number(normalized)-1));return{period:normalized,from:date.toISOString().slice(0,10)};
}

export function summarizePlatformAnalytics(rows:PlatformAnalyticsRow[]){
  const totals={menuViews:0,productViews:0,videoPlays:0,cartAdds:0,shares:0,contactClicks:0};
  const days=new Map<string,{date:string;menuViews:number;productViews:number;videoPlays:number;cartAdds:number}>();
  const restaurants=new Map<string,{id:string;name:string;slug:string;menuViews:number;productViews:number;videoPlays:number;cartAdds:number;shares:number;contactClicks:number}>();
  const products=new Map<string,{id:string;name:string;restaurant:string;views:number;videoPlays:number;cartAdds:number}>();const languages={es:0,en:0,other:0};
  const metricByEvent={menu_view:"menuViews",product_view:"productViews",video_play:"videoPlays",cart_add:"cartAdds",share:"shares",contact_click:"contactClicks"} as const;
  for(const row of rows){const count=Math.max(0,Number(row.event_count)||0);if(!count)continue;const restaurant=relation(row.restaurants);const product=relation(row.products);const day=days.get(row.event_date)??{date:row.event_date,menuViews:0,productViews:0,videoPlays:0,cartAdds:0};const restaurantItem=restaurants.get(row.restaurant_id)??{id:row.restaurant_id,name:restaurant?.name??"Restaurante eliminado",slug:restaurant?.slug??"",menuViews:0,productViews:0,videoPlays:0,cartAdds:0,shares:0,contactClicks:0};const key=metricByEvent[row.event_type as keyof typeof metricByEvent];if(key){totals[key]+=count;restaurantItem[key]+=count}if(row.event_type==="menu_view")day.menuViews+=count;if(row.event_type==="product_view")day.productViews+=count;if(row.event_type==="video_play")day.videoPlays+=count;if(row.event_type==="cart_add")day.cartAdds+=count;if(row.product_id&&["product_view","video_play","cart_add"].includes(row.event_type)){const item=products.get(row.product_id)??{id:row.product_id,name:product?.name??"Producto eliminado",restaurant:restaurant?.name??"Restaurante eliminado",views:0,videoPlays:0,cartAdds:0};if(row.event_type==="product_view")item.views+=count;if(row.event_type==="video_play")item.videoPlays+=count;if(row.event_type==="cart_add")item.cartAdds+=count;products.set(row.product_id,item)}languages[row.locale==="es"||row.locale==="en"?row.locale:"other"]+=count;days.set(row.event_date,day);restaurants.set(row.restaurant_id,restaurantItem)}
  return{totals,days:[...days.values()].sort((a,b)=>a.date.localeCompare(b.date)),restaurants:[...restaurants.values()].sort((a,b)=>b.menuViews-a.menuViews||b.productViews-a.productViews),products:[...products.values()].sort((a,b)=>b.views-a.views||b.cartAdds-a.cartAdds),languages,rates:{productsPerVisit:ratio(totals.productViews,totals.menuViews),videoPlayRate:percentage(totals.videoPlays,totals.productViews),cartRate:percentage(totals.cartAdds,totals.productViews),contactRate:percentage(totals.contactClicks,totals.menuViews)}};
}
