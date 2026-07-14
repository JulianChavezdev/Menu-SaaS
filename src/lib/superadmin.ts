import {notFound,redirect} from "next/navigation";
import {createClient as createAdminClient} from "@supabase/supabase-js";
import {createClient} from "@/lib/supabase/server";
import {isSuperadminUser} from "@/lib/superadmin-identity";
import {getSupabaseSecretKey} from "@/lib/supabase/admin-env";

export {isSuperadminUser} from "@/lib/superadmin-identity";

export async function requireSuperadmin(){
  const session=await createClient();
  const {data:{user}}=await session.auth.getUser();
  if(!user)redirect("/login");
  if(!isSuperadminUser(user))notFound();
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey=getSupabaseSecretKey();
  if(!url||!serviceKey)throw new Error("Falta la configuración segura del superadmin.");
  const admin=createAdminClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  return {admin,user};
}
