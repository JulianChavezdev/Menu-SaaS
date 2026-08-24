import { BackButton } from "@/components/ui/back-button";
import { KitchenBoard } from "@/components/dashboard/kitchen-board";
import { activeRestaurant } from "@/lib/permissions";
import {
  kitchenOrderSelect,
  mapKitchenOrders,
  type KitchenOrderRow,
} from "@/lib/kitchen-orders";

export default async function KitchenPage() {
  const { supabase, restaurant } = await activeRestaurant();
  if (!restaurant.ordering_enabled)
    return (
      <main className="mx-auto max-w-3xl p-6">
        <BackButton fallback="/dashboard" />
        <section className="mt-6 border border-stone-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-bold">Menuly Pedidos no está activo</h1>
          <p className="mt-2 text-sm text-slate-600">
            Activa el plan de pedidos para utilizar la pantalla de cocina.
          </p>
        </section>
      </main>
    );
  const { data, error } = await supabase
    .from("dining_orders")
    .select(kitchenOrderSelect)
    .eq("restaurant_id", restaurant.id)
    .in("status", ["pending", "accepted", "preparing", "ready"])
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const orders = mapKitchenOrders((data ?? []) as KitchenOrderRow[]);
  return (
    <main className="mx-auto max-w-[1600px] p-4 md:p-6">
      <BackButton fallback="/dashboard" />
      <div className="mt-5">
        <KitchenBoard
          restaurantId={restaurant.id}
          currency={restaurant.currency}
          initialOrders={orders}
        />
      </div>
    </main>
  );
}
