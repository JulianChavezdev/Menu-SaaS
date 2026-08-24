"use client";
import {LogOut} from "lucide-react";
import {createClient} from "@/lib/supabase/client";
import {useRouter} from "next/navigation";
export function SignOut({compact=false}:{compact?:boolean}){const r=useRouter();return <button aria-label={compact?"Cerrar sesión":undefined} onClick={async()=>{if(!confirm("¿Quieres cerrar la sesión?"))return;await createClient().auth.signOut();sessionStorage.removeItem("carta-video:saas-history");r.push("/");r.refresh()}} className={`dashboard-sign-out inline-flex min-h-11 items-center gap-2 rounded-lg text-sm text-slate-500 transition-colors hover:bg-stone-100 hover:text-slate-950 ${compact?"min-w-11 justify-center p-2":"px-3"}`}><LogOut size={16}/>{compact?null:"Cerrar sesión"}</button>}
