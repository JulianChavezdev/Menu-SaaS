import { KitchenBoard } from "@/components/dashboard/kitchen-board";
import { activeRestaurant } from "@/lib/permissions";
import { loadKitchenOrders } from "@/lib/kitchen-orders-server";

export default async function KitchenPage() {
  const { restaurant } = await activeRestaurant();
  if (!restaurant.ordering_enabled)
    return (
      <main className="mx-auto max-w-3xl p-6">
        <section className="mt-6 border border-stone-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-bold">Menuly Comandas no está activo</h1>
          <p className="mt-2 text-sm text-slate-600">
            Activa el plan de comandas para utilizar la pantalla de cocina.
          </p>
        </section>
      </main>
    );
  const orders = await loadKitchenOrders(restaurant.id);
  return (
    <main className="fixed inset-0 z-[70] overflow-y-auto bg-[#eef1f5] md:relative md:inset-auto md:z-auto md:min-h-screen">
      <KitchenBoard
        restaurantId={restaurant.id}
        currency={restaurant.currency}
        initialOrders={orders}
      />
    </main>
  );
}
