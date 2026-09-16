import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {recordPlatformAlert} from "@/lib/platform-alerts";
import {signupPlan} from "@/lib/signup-plans";

export async function POST(request:Request){
  const headers={"Cache-Control":"no-store"};
  try{const origin=request.headers.get("origin");if(origin&&new URL(origin).origin!==new URL(request.url).origin)return NextResponse.json({ok:false},{status:403,headers})}catch{return NextResponse.json({ok:false},{status:403,headers})}
  const client=await createClient();const {data:{user},error}=await client.auth.getUser();
  if(error||!user)return NextResponse.json({ok:false},{status:401,headers});
  // The authenticated identity is authoritative; ignore any userId supplied by a caller.
  const age=Date.now()-new Date(user.created_at).getTime();
  if(Number.isFinite(age)&&age>=0&&age<=15*60_000)await recordPlatformAlert({kind:"registration",title:"Nueva cuenta registrada",message:"Una nueva cuenta se ha registrado en Menuly.",details:{accountId:user.id,plan:signupPlan(user.user_metadata?.plan_interest)}});
  return NextResponse.json({ok:true},{status:202,headers});
}
