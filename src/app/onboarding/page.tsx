"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRestaurant } from "@/app/dashboard/actions";

export default function Onboarding() {
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      await createRestaurant(new FormData(e.currentTarget));
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el restaurante");
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center p-6 overflow-hidden selection:bg-violet-500/30">
      {/* Luces de fondo coherentes con el diseño de la aplicación (Glow Effects) */}
      <div className="absolute top-1/4 left-1/3 -z-10 h-72 w-72 rounded-full bg-pink-500/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/3 -z-10 h-80 w-80 rounded-full bg-violet-500/10 blur-[150px]" />

      <form 
        onSubmit={submit} 
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

          {/* Selector de color premium integrado */}
          <div className="hidden">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-300">Color principal</span>
              <span className="text-[11px] text-slate-500">Tono visual para la interfaz de tu menú.</span>
            </div>
            <div className="relative flex items-center justify-center h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-700 bg-slate-800 transition-all hover:border-slate-500 focus-within:ring-2 focus-within:ring-violet-500/40">
              <input 
                name="primary_color" 
                type="color" 
                defaultValue="#7c3aed" 
                className="absolute inset-0 h-[200%] w-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            ⚠️ <span>{error}</span>
          </div>
        )}

        {/* Botón de Envío */}
        <button className="mt-6 w-full rounded-xl bg-violet-600 py-3.5 font-semibold text-white shadow-lg shadow-violet-600/20 transition-all duration-200 hover:bg-violet-500 hover:shadow-violet-500/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50">
          Crear restaurante
        </button>
      </form>
    </main>
  );
}
