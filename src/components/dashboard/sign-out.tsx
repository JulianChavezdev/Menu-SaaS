"use client";
import {LogOut} from "lucide-react";
import {createClient} from "@/lib/supabase/client";
import {useRouter} from "next/navigation";
export function SignOut(){const r=useRouter();return <button onClick={async()=>{if(!confirm("¿Quieres cerrar la sesión?"))return;await createClient().auth.signOut();sessionStorage.removeItem("carta-video:saas-history");r.push("/");r.refresh()}} className="dashboard-sign-out inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-slate-400 transition-colors hover:bg-white/10 hover:text-white"><LogOut size={16}/>Cerrar sesión</button>}
