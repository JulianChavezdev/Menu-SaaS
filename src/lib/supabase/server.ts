import {createServerClient,type CookieOptions} from "@supabase/ssr";
import {cookies} from "next/headers";
import {getSupabasePublicKey,getSupabaseUrl} from "@/lib/supabase/env";

export async function createClient(){
  const store=await cookies();
  return createServerClient(getSupabaseUrl()||"https://placeholder.supabase.co",getSupabasePublicKey()||"placeholder",{
    cookies:{
      getAll:()=>store.getAll(),
      setAll(changes:{name:string;value:string;options:CookieOptions}[]){
        try{
          changes.forEach(({name,value,options})=>store.set(name,value,options));
        }catch{
          // Server Components cannot write cookies; middleware refreshes those sessions.
        }
      },
    },
  });
}
