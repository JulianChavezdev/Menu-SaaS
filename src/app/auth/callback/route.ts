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
  return NextResponse.redirect(new URL(next,url.origin));
}
