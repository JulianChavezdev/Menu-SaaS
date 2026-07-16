"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { PasswordInput } from "@/components/ui/password-input";

export default function Register() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if(pending)return;
    setPending(true);
    const f = new FormData(e.currentTarget);
    const { error } = await createClient().auth.signUp({
      email: String(f.get("email")),
      password: String(f.get("password")),
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=/dashboard`,
      },
    });
    setMessage(error ? error.message : "Revisa tu correo para confirmar la cuenta.");
    setPending(false);
  }

  return (
    <main className="relative grid min-h-screen place-items-center p-6 overflow-hidden selection:bg-orange-600/30">

      <div className="absolute top-1/4 left-1/3 -z-10 h-72 w-72 rounded-full bg-pink-500/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/3 -z-10 h-80 w-80 rounded-full bg-orange-100 blur-[150px]" />

      <form 
        onSubmit={submit}
        aria-busy={pending}
        className="relative w-full max-w-md rounded-xl border border-stone-300 bg-white p-8 shadow-md   ring-1 ring-stone-200"
      >
   
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-3 py-1 text-[10px] font-semibold tracking-wider text-pink-300 uppercase">
            ⚡ Carta Video
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950">
            Crea tu cuenta
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Empieza a transformar tu menú en vídeos irresistibles.
          </p>
        </div>

     
        <div className="space-y-5">
          <label className="block text-sm font-medium text-slate-700">
            Correo electrónico
            <input 
              name="email" 
              required 
              type="email" 
              autoComplete="email"
              placeholder="tu@restaurante.com"
              className="mt-2 w-full rounded-xl border border-stone-300 bg-stone-100 px-4 py-3 text-slate-950 placeholder-slate-400 transition-all duration-200 hover:border-stone-400 focus:border-orange-500 focus:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </label>

          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-slate-700">Contraseña</label>
            <PasswordInput 
              id="register-password"
              name="password" 
              required 
              minLength={8} 
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-xl border border-stone-300 bg-stone-100 px-4 py-3 text-slate-950 placeholder-slate-400 transition-all duration-200 hover:border-stone-400 focus:border-orange-500 focus:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

     
        <button disabled={pending} className="mt-6 w-full rounded-xl bg-orange-600 py-3.5 font-semibold text-white shadow-lg  transition-all duration-200 hover:bg-orange-600  focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:cursor-wait disabled:opacity-60">
          {pending?"Creando cuenta…":"Registrarme"}
        </button>

   
        {message && (
          <div 
            role="alert" 
            className={`mt-4 flex items-center gap-2 rounded-xl border p-3 text-sm ${
              message.includes("Revisa tu correo") 
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-800"
                : "border-red-500/20 bg-red-500/10 text-red-700"
            }`}
          >
            <span>{message.includes("Revisa tu correo") ? "📩" : "⚠️"}</span>
            <span>{message}</span>
          </div>
        )}

    
        <p className="mt-6 text-center text-xs text-slate-600">
          ¿Ya tienes cuenta?{" "}
          <Link className="font-medium text-orange-700 hover:text-orange-700 underline underline-offset-4" href="/login">
            Inicia sesión
          </Link>
        </p>
      </form>
    </main>
  );
}
