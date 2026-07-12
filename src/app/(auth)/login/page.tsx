"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PasswordInput } from "@/components/ui/password-input";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await createClient().auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    else router.push("/dashboard");
  }

  return (
    <main className="relative grid min-h-screen place-items-center p-6 overflow-hidden selection:bg-violet-500/30">
      {/* Luces de fondo coherentes con la landing page (Glow Effects) */}
      <div className="absolute top-1/4 left-1/3 -z-10 h-72 w-72 rounded-full bg-pink-500/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/3 -z-10 h-80 w-80 rounded-full bg-violet-500/10 blur-[150px]" />

      <form 
        onSubmit={submit} 
        className="relative w-full max-w-md rounded-[2rem] border border-slate-800 bg-slate-950/60 p-8 shadow-2xl shadow-violet-950/10 backdrop-blur-xl ring-1 ring-white/5"
      >
        {/* Cabecera del formulario */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-3 py-1 text-[10px] font-semibold tracking-wider text-pink-300 uppercase">
            ⚡ Carta Video
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Accede a tu cuenta
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Gestiona tus cartas digitales y aumenta tus ventas.
          </p>
        </div>

        {/* Inputs Estilizados */}
        <div className="space-y-5">
          <label className="block text-sm font-medium text-slate-300">
            Correo electrónico
            <input 
              required 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="tu@restaurante.com"
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 transition-all duration-200 hover:border-slate-700 focus:border-violet-500 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </label>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-300">Contraseña</label>
            <PasswordInput 
              id="login-password"
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 transition-all duration-200 hover:border-slate-700 focus:border-violet-500 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            ⚠️ <span>{error}</span>
          </div>
        )}

        {/* Botón de Acción Principal */}
        <button className="mt-6 w-full rounded-xl bg-violet-600 py-3.5 font-semibold text-white shadow-lg shadow-violet-600/20 transition-all duration-200 hover:bg-violet-500 hover:shadow-violet-500/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50">
          Entrar al panel
        </button>

        {/* Links Inferiores */}
        <p className="mt-6 text-center text-xs text-slate-400 space-x-2">
          <span>¿No tienes cuenta?</span>
          <Link className="font-medium text-violet-400 hover:text-violet-300 underline underline-offset-4" href="/register">
            Regístrate
          </Link>
          <span className="text-slate-600">·</span>
          <Link className="font-medium text-slate-400 hover:text-slate-300 underline underline-offset-4" href="/forgot-password">
            Olvidé mi contraseña
          </Link>
        </p>
      </form>
    </main>
  );
}
