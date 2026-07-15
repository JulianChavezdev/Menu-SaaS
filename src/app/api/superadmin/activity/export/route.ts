import {NextResponse} from "next/server";
import {activityCsv,activityItems,safeActivityDate,type AuditActivityRow} from "@/lib/audit-activity";
import {superadminApiContext} from "@/lib/superadmin-api";

export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"};

export async function GET(request:Request){
  const context=await superadminApiContext();if(context.status!==200)return NextResponse.json({error:context.status===401?"Authentication required":context.status===403?"Forbidden":"Export unavailable"},{status:context.status,headers});
  const params=new URL(request.url).searchParams;const from=safeActivityDate(params.get("from"));const to=safeActivityDate(params.get("to"),true);
  let query=context.admin.from("superadmin_audit_log").select("id,actor_user_id,restaurant_id,action,details,created_at,restaurants(name,slug)").order("created_at",{ascending:false}).limit(5000);
  if(from)query=query.gte("created_at",from);if(to)query=query.lte("created_at",to);
  const {data,error}=await query;if(error)return NextResponse.json({error:"Activity export unavailable"},{status:503,headers});
  const items=activityItems((data??[]) as AuditActivityRow[],{group:params.get("group"),q:params.get("q")});const stamp=new Date().toISOString().slice(0,10);
  return new NextResponse(activityCsv(items),{headers:{...headers,"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="actividad-${stamp}.csv"`}});
}
