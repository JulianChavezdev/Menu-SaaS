import { createServerClient } from "@supabase/ssr";import { cookies } from "next/headers";
export async function createClient(){const store=await cookies();return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL||"https://placeholder.supabase.co",process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"placeholder",{cookies:{getAll:()=>store.getAll(),setAll:()=>{}}})}
