"use client";

import {useState} from "react";
import Link from "next/link";
import {createClient} from "@/lib/supabase/client";
import {BrandLogo} from "@/components/brand/brand-logo";

export default function Forgot(){
  const[message,setMessage]=useState("");
  const[pending,setPending]=useState(false);
  return <main className="grid min-h-screen place-items-center p-5"><form aria-busy={pending} onSubmit={async event=>{event.preventDefault();if(pending)return;setPending(true);const email=new FormData(event.currentTarget).get("email") as string;const{error}=await createClient().auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}/auth/callback?next=/reset-password`});setMessage(error?error.message:"Si existe una cuenta, recibirás un enlace.");setPending(false)}} className="glass w-full max-w-md rounded-3xl p-6"><BrandLogo priority className="mb-6 w-[145px]"/><h1 className="text-2xl font-bold">Recuperar contraseña</h1><label className="mt-5 block text-sm font-medium">Correo electrónico<input required name="email" type="email" autoComplete="email" placeholder="tu@restaurante.com" className="mt-2 w-full rounded-lg p-3 text-slate-900"/></label><button disabled={pending} className="mt-4 w-full rounded-lg bg-orange-600 p-3 disabled:cursor-wait disabled:opacity-60">{pending?"Enviando…":"Enviar enlace"}</button>{message&&<p role="status" className="mt-3 text-sm">{message}</p>}<Link className="mt-4 block text-sm underline" href="/login">Volver</Link></form></main>;
}
