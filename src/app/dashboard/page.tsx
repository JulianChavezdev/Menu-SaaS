import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { activeRestaurant } from "@/lib/permissions";

export default async function Dashboard() {
  const { restaurant, supabase } = await activeRestaurant();

  const [{ count: products }, { count: categories }, { count: videos }] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id),
    supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id)
      .not("video_url", "is", null),
  ]);

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-8 animate-in fade-in duration-300 min-h-screen flex flex-col justify-start">
      {/* Cabecera Principal */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-5 gap-4">
        <div className="flex flex-col gap-1">
          <BackButton fallback="/" />
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Hola, {restaurant.name}
          </h1>
          <p className="text-sm text-slate-400">
            Gestiona productos, identidad corporativa y la disponibilidad de tu negocio.
          </p>
        </div>

        {/* Estado Dinámico de la Carta */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Estado:</span>
          <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold border ${
            restaurant.is_published 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
              : "bg-amber-500/10 border-amber-500/30 text-amber-400"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${restaurant.is_published ? "bg-emerald-400" : "bg-amber-400"}`} />
            {restaurant.is_published ? 'Publicada' : 'Borrador'}
          </span>
        </div>
      </div>

      {/* Módulo de Estadísticas Clave */}
      <section className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-3">
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm shadow-md">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Productos</p>
          <p className="mt-2 text-3xl font-black bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            {products ?? 0}
          </p>
        </div>
        
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm shadow-md">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Categorías</p>
          <p className="mt-2 text-3xl font-black bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            {categories ?? 0}
          </p>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm shadow-md">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vídeos enlazados</p>
          <p className="mt-2 text-3xl font-black text-violet-400">
            {videos ?? 0}
          </p>
        </div>
      </section>

      {/* Grid Bento de Herramientas de Control */}
      <h2 className="mt-10 text-xs font-bold text-slate-500 uppercase tracking-wider">Herramientas del panel</h2>
      
      <div className="mt-4 grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Enlace Principal: Gestor de la Carta */}
        <Link 
          href="/dashboard/menu" 
          className="group relative flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-950/40 p-6 backdrop-blur-sm shadow-xl transition-all duration-200 hover:border-violet-500/50 hover:bg-slate-900/30 overflow-hidden"
        >
          <div className="absolute top-0 right-0 -z-10 h-32 w-32 rounded-full bg-violet-600/5 blur-2xl group-hover:bg-violet-600/10 transition-all" />
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 text-lg group-hover:bg-violet-600/20">
              📋
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-200 group-hover:text-white">Gestionar catálogo de carta</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Modifica la estructura de tus platos, organiza el orden de tus menús y edita la disponibilidad en tiempo real.
            </p>
          </div>
          <span className="mt-6 text-xs font-semibold text-violet-400 group-hover:text-violet-300 flex items-center gap-1">
            Abrir administrador de carta →
          </span>
        </Link>

        {/* Enlace Secundario: Vista Previa Pública */}
        <a 
          href={`/r/${restaurant.slug}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="group relative flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-950/40 p-6 backdrop-blur-sm shadow-xl transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/30 overflow-hidden"
        >
          <div className="absolute top-0 right-0 -z-10 h-32 w-32 rounded-full bg-pink-600/5 blur-2xl group-hover:bg-pink-600/10 transition-all" />
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-lg group-hover:border-slate-700">
              🎥
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-200 group-hover:text-white">Ver carta interactiva pública</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Visualiza en vivo la interfaz móvil interactiva que escanearán tus clientes finales en las mesas.
            </p>
          </div>
          <span className="mt-6 text-xs font-semibold text-slate-400 group-hover:text-slate-200 flex items-center gap-1">
            Abrir URL en pestaña nueva ↗
          </span>
        </a>
      </div>
    </main>
  );
}