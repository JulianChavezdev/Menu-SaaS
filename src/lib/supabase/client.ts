import {createBrowserClient} from "@supabase/ssr";
import {getSupabasePublicKey,getSupabaseUrl} from "@/lib/supabase/env";
export const createClient=()=>createBrowserClient(getSupabaseUrl()||"https://placeholder.supabase.co",getSupabasePublicKey()||"placeholder");
