import { activeRestaurant } from "@/lib/permissions";
import { CategoriesManager } from "@/components/dashboard/categories-manager";
import { BackButton } from "@/components/ui/back-button";

export default async function Page() {
  const { supabase, restaurant } = await activeRestaurant();
  
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .order("sort_order");

  return (
    // Móvil: scroll nativo fluido. Escritorio: pantalla congelada fija.
    <main className="mx-auto max-w-5xl p-4 md:p-6 h-auto md:h-screen flex flex-col overflow-visible md:overflow-hidden animate-in fade-in duration-300">
      
      {/* Cabecera Fija */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-shrink-0">
        <div className="flex flex-col gap-0.5">
          <BackButton fallback="/dashboard" />
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Categorías
          </h1>
          <p className="text-xs text-slate-400">
            Estructura los bloques principales de tu menú (ej. Entrantes, Postres, Bebidas).
          </p>
        </div>
      </div>

      {/* Contenedor del Gestor */}
      <div className="mt-6 flex-grow overflow-visible md:overflow-hidden bg-slate-950/40 border border-slate-800/80 rounded-[1.5rem] p-5 backdrop-blur-sm shadow-xl flex flex-col">
        
        {/* Encabezado interno de sección */}
        <div className="flex-shrink-0 mb-4 pb-2 border-b border-slate-800/60">
          <h2 className="text-sm font-semibold text-slate-200">
            Organización del menú
          </h2>
          <p className="text-[11px] text-slate-500">
            Crea nuevas categorías, edita su estado de activación o arrástralas para cambiar el orden de visualización.
          </p>
        </div>

        {/* Zona de scroll aislada para el listado en escritorio */}
        <div className="w-full h-auto md:h-[calc(100vh-16rem)] overflow-visible md:overflow-y-auto pr-0 md:pr-1 custom-scrollbar">
          <CategoriesManager categories={data ?? []} />
        </div>
        
      </div>
    </main>
  );
}
