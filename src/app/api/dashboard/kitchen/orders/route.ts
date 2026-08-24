import { NextResponse } from "next/server";
import { activeRestaurant } from "@/lib/permissions";
import { loadKitchenOrders } from "@/lib/kitchen-orders-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const { restaurant } = await activeRestaurant();
  if (!restaurant.ordering_enabled)
    return NextResponse.json(
      { error: "Menuly Comandas no está activo." },
      { status: 403 },
    );

  try {
    const orders = await loadKitchenOrders(restaurant.id);
    return NextResponse.json(
      { orders },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudieron actualizar las comandas." },
      { status: 500 },
    );
  }
}
