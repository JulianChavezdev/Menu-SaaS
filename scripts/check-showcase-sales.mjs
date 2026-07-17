import dotenv from "dotenv";
import {createClient} from "@supabase/supabase-js";

dotenv.config({path:".env.local",quiet:true});
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw new Error("Faltan las credenciales de Supabase.");
const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:restaurant,error:restaurantError}=await client.from("restaurants").select("id").eq("slug","bistro-nube").single();
if(restaurantError)throw restaurantError;
const {count,error:recommendationError}=await client.from("product_recommendations").select("id",{count:"exact",head:true}).eq("restaurant_id",restaurant.id);
if(recommendationError)throw recommendationError;
const today=new Date().toISOString().slice(0,10);
const {data:events,error:eventError}=await client.from("menu_analytics_daily").select("event_type,event_count").eq("restaurant_id",restaurant.id).eq("event_date",today).in("event_type",["detail_open","recommendation_add"]);
if(eventError)throw eventError;
const totals={detail_open:0,recommendation_add:0};for(const event of events??[])totals[event.event_type]=(totals[event.event_type]??0)+Number(event.event_count);
if(count!==21)throw new Error(`Se esperaban 21 recomendaciones y existen ${count??0}.`);
if(process.argv.includes("--require-event")&&(!totals.detail_open||!totals.recommendation_add))throw new Error("No se registró la interacción completa de detalle y recomendación.");
console.log(`Demo comercial correcta: ${count} recomendaciones, ${totals.detail_open} detalles abiertos y ${totals.recommendation_add} añadidos sugeridos hoy.`);
