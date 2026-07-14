import {NextResponse} from "next/server";
import {productsCsv,restaurantBackup,safeExportName} from "@/lib/restaurant-export";
import {superadminApiContext} from "@/lib/superadmin-api";

export const dynamic="force-dynamic";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const privateHeaders={"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"};

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const context=await superadminApiContext();
  if(context.status!==200)return NextResponse.json({error:context.status===401?"Authentication required":context.status===403?"Forbidden":"Export unavailable"},{status:context.status,headers:privateHeaders});
  const {id}=await params;
  if(!UUID.test(id))return NextResponse.json({error:"Invalid restaurant"},{status:400,headers:privateHeaders});
  const format=new URL(request.url).searchParams.get("format")==="csv"?"csv":"json";
  const {admin,user}=context;
  const[{data:restaurant,error},{data:categories},{data:products},{data:members},{data:subscription},{data:payments},{data:analytics},{data:audit}]=await Promise.all([
    admin.from("restaurants").select("*").eq("id",id).maybeSingle(),
    admin.from("categories").select("*").eq("restaurant_id",id).order("sort_order"),
    admin.from("products").select("*,categories(name)").eq("restaurant_id",id).order("sort_order"),
    admin.from("restaurant_members").select("id,user_id,role,created_at").eq("restaurant_id",id).order("created_at"),
    admin.from("subscriptions").select("*").eq("restaurant_id",id).maybeSingle(),
    admin.from("manual_payments").select("*").eq("restaurant_id",id).order("paid_at"),
    admin.from("menu_analytics_daily").select("event_date,event_type,dimension_key,product_id,locale,event_count").eq("restaurant_id",id).order("event_date"),
    admin.from("superadmin_audit_log").select("id,actor_user_id,action,details,created_at").eq("restaurant_id",id).order("created_at"),
  ]);
  if(error||!restaurant)return NextResponse.json({error:"Restaurant not found"},{status:404,headers:privateHeaders});
  const identities=await Promise.all((members??[]).map(async member=>{const result=await admin.auth.admin.getUserById(member.user_id);return{...member,email:result.data.user?.email??null}}));
  const owner=await admin.auth.admin.getUserById(restaurant.owner_id);
  const filename=safeExportName(restaurant.slug);
  if(format==="csv"){
    const rows=(products??[]).map(product=>({...product,currency:restaurant.currency,category:(product.categories as unknown as {name?:string}|null)?.name??""}));
    return new NextResponse(productsCsv(rows),{headers:{...privateHeaders,"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="${filename}-carta.csv"`}});
  }
  const body=restaurantBackup({exportedBy:{id:user.id,email:user.email??null},restaurant,owner:{id:restaurant.owner_id,email:owner.data.user?.email??null},categories:categories??[],products:products??[],members:identities,subscription:subscription??null,manualPayments:payments??[],analytics:analytics??[],auditLog:audit??[]});
  return new NextResponse(body,{headers:{...privateHeaders,"Content-Type":"application/json; charset=utf-8","Content-Disposition":`attachment; filename="${filename}-backup.json"`}});
}
