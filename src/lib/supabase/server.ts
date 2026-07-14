import {createServerClient} from "@supabase/ssr";import {cookies} from "next/headers";import {getSupabasePublicKey,getSupabaseUrl} from "@/lib/supabase/env";
export async function createClient(){const store=await cookies();return createServerClient(getSupabaseUrl()||"https://placeholder.supabase.co",getSupabasePublicKey()||"placeholder",{cookies:{getAll:()=>store.getAll(),setAll:()=>{}}})}
