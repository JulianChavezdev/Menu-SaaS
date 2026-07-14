import {createClient as createAdminClient} from "@supabase/supabase-js";
import {createClient} from "@/lib/supabase/server";
import {isSuperadminUser} from "@/lib/superadmin-identity";
import {getSupabaseSecretKey} from "@/lib/supabase/admin-env";

export async function superadminApiContext(){
  const session=await createClient();
  const {data:{user}}=await session.auth.getUser();
  if(!user)return{status:401 as const};
  if(!isSuperadminUser(user))return{status:403 as const};
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=getSupabaseSecretKey();
  if(!url||!key)return{status:503 as const};
  return{status:200 as const,user,admin:createAdminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})};
}
