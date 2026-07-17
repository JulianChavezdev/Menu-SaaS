import {NextResponse} from "next/server";
import {activeRestaurant} from "@/lib/permissions";
import {summarizeAnalytics} from "@/lib/analytics";
import {analyticsPeriodRange,analyticsReportCsv,parseAnalyticsPeriod} from "@/lib/analytics-report";
import {safeExportName} from "@/lib/restaurant-export";

export async function GET(request:Request){
  const days=parseAnalyticsPeriod(new URL(request.url).searchParams.get("days"));
  const range=analyticsPeriodRange(days);
  const{supabase,restaurant}=await activeRestaurant();
  const{data,error}=await supabase.from("menu_analytics_daily").select("event_date,event_type,event_count,dimension_key,product_id,locale,products(name,category_id,categories(name))").eq("restaurant_id",restaurant.id).gte("event_date",range.currentFrom).lte("event_date",range.currentTo).order("event_date");
  if(error)return NextResponse.json({error:"No se pudo generar el informe."},{status:503});
  const csv=analyticsReportCsv(summarizeAnalytics(data??[]),restaurant.name,days);
  return new NextResponse(csv,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="${safeExportName(restaurant.slug)}-analiticas-${days}d.csv"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}
