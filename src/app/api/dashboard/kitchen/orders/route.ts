import { NextResponse } from "next/server";
import { activeRestaurant } from "@/lib/permissions";
import { loadKitchenOrders } from "@/lib/kitchen-orders-server";
import { canUseKitchen } from "@/lib/member-roles";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const { restaurant, member } = await activeRestaurant();
  if (!canUseKitchen(member.role))
    return NextResponse.json({ error: "No tienes acceso a Cocina." }, { status: 403 });
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
