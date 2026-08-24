import { BackButton } from "@/components/ui/back-button";
import { WaiterPos } from "@/components/dashboard/waiter-pos";
import { activeRestaurant } from "@/lib/permissions";

export default async function PosPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string }>;
}) {
  const { supabase, restaurant } = await activeRestaurant();
  if (!restaurant.ordering_enabled) return <Unavailable />;

  const [{ data: tables }, { data: categories }, { data: products }] =
    await Promise.all([
      supabase
        .from("restaurant_tables")
        .select("id,name,is_active,sort_order")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true)
        .order("sort_order")
        .order("name"),
      supabase
        .from("categories")
        .select("id,name,sort_order")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true)
        .order("sort_order")
        .order("name"),
      supabase
        .from("products")
        .select(
          "id,category_id,name,price_cents,image_url,is_available,sort_order",
        )
        .eq("restaurant_id", restaurant.id)
        .eq("is_available", true)
        .order("sort_order")
        .order("name"),
    ]);
  const requestedTable = (await searchParams).table;

  return (
    <main className="fixed inset-0 z-[70] overflow-y-auto bg-[#eef1f5] md:relative md:inset-auto md:z-auto md:min-h-screen">
      <WaiterPos
        restaurantName={restaurant.name}
        currency={restaurant.currency}
        tables={tables ?? []}
        categories={categories ?? []}
        products={products ?? []}
        initialTableId={requestedTable}
      />
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
          El comandero móvil pertenece al plan de 59,99 €.
        </p>
      </section>
    </main>
  );
}
