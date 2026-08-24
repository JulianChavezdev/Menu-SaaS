import Link from "next/link";
import { ArrowRight, Table2 } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { activeRestaurant } from "@/lib/permissions";
import {
  createDiningTable,
  setDiningTableActive,
} from "@/app/dashboard/ordering/actions";

export default async function TablesPage() {
  const { supabase, restaurant } = await activeRestaurant();
  if (!restaurant.ordering_enabled) return <Unavailable />;
  const { data: tables, error } = await supabase
    .from("restaurant_tables")
    .select("id,name,is_active,sort_order")
    .eq("restaurant_id", restaurant.id)
    .order("sort_order")
    .order("created_at");
  if (error) throw new Error(error.message);

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-6">
      <BackButton fallback="/dashboard" />
      <div className="mt-5 flex flex-col gap-4 border-b border-stone-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-700">
            Menuly Comandas
          </p>
          <h1 className="mt-1 text-3xl font-extrabold">
            Organización de mesas
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Estas mesas aparecerán directamente en el comandero. No es necesario
            abrirlas, cerrarlas ni controlar sesiones.
          </p>
        </div>
        <form action={createDiningTable} className="flex gap-2">
          <input
            name="name"
            required
            maxLength={40}
            placeholder="Ej. Terraza 4"
            className="min-w-0 flex-1 border border-stone-300 bg-white px-3 py-2.5"
          />
          <button className="bg-orange-600 px-4 py-2.5 text-sm font-bold text-white">
            Añadir mesa
          </button>
        </form>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {tables?.filter((table) => table.is_active).length ?? 0} mesas
          disponibles en el comandero.
        </p>
        <Link
          href="/dashboard/pos"
          className="inline-flex min-h-11 items-center gap-2 bg-slate-950 px-4 py-2.5 text-sm font-bold text-white"
        >
          Abrir comandero <ArrowRight size={17} />
        </Link>
      </div>

      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {(tables ?? []).map((table) => (
          <article
            key={table.id}
            className={`flex min-h-36 flex-col justify-between border bg-white p-4 shadow-sm ${table.is_active ? "border-stone-200" : "border-stone-300 opacity-60"}`}
          >
            <div>
              <Table2
                size={24}
                className={
                  table.is_active ? "text-orange-600" : "text-stone-400"
                }
              />
              <h2 className="mt-4 text-lg font-bold">{table.name}</h2>
              <p className="mt-1 text-xs text-slate-500">
                {table.is_active ? "Disponible" : "Oculta"}
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {table.is_active && (
                <Link
                  href={`/dashboard/pos?table=${table.id}`}
                  className="bg-slate-900 px-3 py-2 text-center text-xs font-bold text-white"
                >
                  Tomar comanda
                </Link>
              )}
              <form action={setDiningTableActive}>
                <input type="hidden" name="table_id" value={table.id} />
                <input
                  type="hidden"
                  name="active"
                  value={table.is_active ? "false" : "true"}
                />
                <button className="w-full border border-stone-300 px-3 py-2 text-xs">
                  {table.is_active ? "Ocultar" : "Mostrar"}
                </button>
              </form>
            </div>
          </article>
        ))}
        {!tables?.length && (
          <div className="col-span-full border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-slate-500">
            Añade la primera mesa para comenzar a tomar comandas.
          </div>
        )}
      </section>
    </main>
  );
}

function Unavailable() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <BackButton fallback="/dashboard" />
      <section className="mt-6 border border-stone-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-bold">Menuly Comandas no está activo</h1>
        <p className="mt-2 text-sm text-slate-600">
          El plan de 59,99 € incluye comandero móvil, mesas y Cocina.
        </p>
      </section>
    </main>
  );
}
