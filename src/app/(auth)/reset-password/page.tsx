"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
import {PasswordInput} from "@/components/ui/password-input";

export default function Reset(){
  const[message,setMessage]=useState("");
  const[pending,setPending]=useState(false);
  const router=useRouter();
  return <main className="grid min-h-screen place-items-center p-5"><form aria-busy={pending} onSubmit={async event=>{event.preventDefault();if(pending)return;setPending(true);const password=new FormData(event.currentTarget).get("password") as string;const {error}=await createClient().auth.updateUser({password});if(error){setMessage(error.message);setPending(false)}else{setMessage("Contraseña actualizada.");router.push("/dashboard")}}} className="glass w-full max-w-md rounded-3xl p-6"><h1 className="text-2xl font-bold">Nueva contraseña</h1><label htmlFor="new-password" className="mt-5 block text-sm font-medium">Nueva contraseña</label><PasswordInput id="new-password" required minLength={8} name="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" className="w-full rounded-lg p-3 text-slate-900"/><button disabled={pending} className="mt-4 w-full rounded-lg bg-orange-600 p-3 disabled:cursor-wait disabled:opacity-60">{pending?"Actualizando…":"Actualizar contraseña"}</button>{message&&<p role="alert" className="mt-3 text-sm">{message}</p>}</form></main>;
}
