import { NextResponse } from "next/server";
import { activeRestaurant } from "@/lib/permissions";
import {
  kitchenOrderSelect,
  mapKitchenOrders,
  type KitchenOrderRow,
} from "@/lib/kitchen-orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const { supabase, restaurant } = await activeRestaurant();
  if (!restaurant.ordering_enabled)
    return NextResponse.json(
      { error: "Menuly Comandas no está activo." },
      { status: 403 },
    );

  const { data, error } = await supabase
    .from("dining_orders")
    .select(kitchenOrderSelect)
    .eq("restaurant_id", restaurant.id)
    .in("status", ["pending", "accepted", "preparing", "ready"])
    .order("created_at", { ascending: true });

  if (error)
    return NextResponse.json(
      { error: "No se pudieron actualizar las comandas." },
      { status: 500 },
    );

  return NextResponse.json(
    { orders: mapKitchenOrders((data ?? []) as KitchenOrderRow[]) },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
