import {recordPlatformAlert} from "@/lib/platform-alerts";
import {signupPlan} from "@/lib/signup-plans";
import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {safeRedirectPath} from "@/lib/safe-redirect";

export async function GET(request:Request){
  const url=new URL(request.url);
  const code=url.searchParams.get("code");
  const next=safeRedirectPath(url.searchParams.get("next"));
  if(!code)return NextResponse.redirect(new URL("/login?error=invalid_callback",url.origin));
  const supabase=await createClient();
  const {error}=await supabase.auth.exchangeCodeForSession(code);
  if(error)return NextResponse.redirect(new URL("/login?error=auth_callback",url.origin));
  const {data:{user}}=await supabase.auth.getUser();
  if(user&&Date.now()-new Date(user.created_at).getTime()<15*60_000)await recordPlatformAlert({kind:"registration",title:"Nueva cuenta registrada",message:"Una nueva cuenta se ha registrado en Menuly.",details:{accountId:user.id,plan:signupPlan(user.user_metadata?.plan_interest)}});
  return NextResponse.redirect(new URL(next,url.origin));
}
