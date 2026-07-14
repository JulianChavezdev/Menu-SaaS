"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRestaurant } from "@/app/dashboard/actions";

export default function Onboarding() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if(pending)return;
    setPending(true);
    setError("");
    try {
      await createRestaurant(new FormData(e.currentTarget));
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el restaurante");
      setPending(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center p-6 overflow-hidden selection:bg-violet-500/30">
      {/* Luces de fondo coherentes con el diseño de la aplicación (Glow Effects) */}
      <div className="absolute top-1/4 left-1/3 -z-10 h-72 w-72 rounded-full bg-pink-500/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/3 -z-10 h-80 w-80 rounded-full bg-violet-500/10 blur-[150px]" />

      <form 
        onSubmit={submit}
        aria-busy={pending}
        className="relative w-full max-w-md rounded-[2rem] border border-slate-800 bg-slate-950/60 p-8 shadow-2xl shadow-violet-950/10 backdrop-blur-xl ring-1 ring-white/5"
      >
        {/* Cabecera del Onboarding */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[10px] font-semibold tracking-wider text-violet-300 uppercase">
            🚀 Primeros pasos
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Crea tu restaurante
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Configura el espacio inicial para empezar a subir tus platos en vídeo.
          </p>
        </div>

        {/* Inputs Estilizados */}
        <div className="space-y-5">
          <label className="block text-sm font-medium text-slate-300">
            Nombre
            <input 
              name="name" 
              required 
              type="text"
              autoComplete="organization"
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 transition-all duration-200 hover:border-slate-700 focus:border-violet-500 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </label>

          <label className="block text-sm font-medium text-slate-300">
            Slug público
            <input 
              name="slug" 
              required 
              type="text"
              placeholder="pizzeria-roma"
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 transition-all duration-200 hover:border-slate-700 focus:border-violet-500 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </label>

        </div>

        {/* Mensaje de Error */}
        {error && (
          <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            ⚠️ <span>{error}</span>
          </div>
        )}

        {/* Botón de Envío */}
        <button disabled={pending} className="mt-6 w-full rounded-xl bg-violet-600 py-3.5 font-semibold text-white shadow-lg shadow-violet-600/20 transition-all duration-200 hover:bg-violet-500 hover:shadow-violet-500/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:cursor-wait disabled:opacity-60">
          {pending?"Creando restaurante…":"Crear restaurante"}
        </button>
      </form>
    </main>
  );
}
