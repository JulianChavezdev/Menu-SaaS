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
    <main className="relative grid min-h-screen place-items-center p-6 overflow-hidden selection:bg-orange-600/30">
      {/* Luces de fondo coherentes con el diseño de la aplicación (Glow Effects) */}
      <div className="absolute top-1/4 left-1/3 -z-10 h-72 w-72 rounded-full bg-pink-500/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/3 -z-10 h-80 w-80 rounded-full bg-orange-100 blur-[150px]" />

      <form 
        onSubmit={submit}
        aria-busy={pending}
        className="relative w-full max-w-md rounded-xl border border-stone-300 bg-white p-8 shadow-md   ring-1 ring-stone-200"
      >
        {/* Cabecera del Onboarding */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-100 px-3 py-1 text-[10px] font-semibold tracking-wider text-orange-700 uppercase">
            🚀 Primeros pasos
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950">
            Crea tu restaurante
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Configura el espacio inicial para empezar a subir tus platos en vídeo.
          </p>
        </div>

        {/* Inputs Estilizados */}
        <div className="space-y-5">
          <label className="block text-sm font-medium text-slate-700">
            Nombre
            <input 
              name="name" 
              required 
              type="text"
              autoComplete="organization"
              className="mt-2 w-full rounded-xl border border-stone-300 bg-stone-100 px-4 py-3 text-slate-950 placeholder-slate-400 transition-all duration-200 hover:border-stone-400 focus:border-orange-500 focus:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Slug público
            <input 
              name="slug" 
              required 
              type="text"
              placeholder="pizzeria-roma"
              className="mt-2 w-full rounded-xl border border-stone-300 bg-stone-100 px-4 py-3 text-slate-950 placeholder-slate-400 transition-all duration-200 hover:border-stone-400 focus:border-orange-500 focus:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </label>

        </div>

        {/* Mensaje de Error */}
        {error && (
          <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-700">
            ⚠️ <span>{error}</span>
          </div>
        )}

        {/* Botón de Envío */}
        <button disabled={pending} className="mt-6 w-full rounded-xl bg-orange-600 py-3.5 font-semibold text-white shadow-lg  transition-all duration-200 hover:bg-orange-600  focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:cursor-wait disabled:opacity-60">
          {pending?"Creando restaurante…":"Crear restaurante"}
        </button>
      </form>
    </main>
  );
}
