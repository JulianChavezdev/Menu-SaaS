import { createClient } from "@supabase/supabase-js";
import { getSupabaseSecretKey } from "@/lib/supabase/admin-env";
import {
  kitchenOrderSelect,
  mapKitchenOrders,
  type KitchenOrder,
  type KitchenOrderRow,
} from "@/lib/kitchen-orders";

export async function loadKitchenOrders(
  restaurantId: string,
): Promise<KitchenOrder[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getSupabaseSecretKey();
  if (!url || !key) throw new Error("Cocina no está disponible.");

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin
    .from("dining_orders")
    .select(kitchenOrderSelect)
    .eq("restaurant_id", restaurantId)
    .or("status.in.(pending,accepted,preparing,ready),and(status.eq.delivered,payment_status.eq.unpaid,or(order_source.eq.table_qr,fulfillment.eq.pickup))")
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) throw new Error("No se pudieron cargar las comandas.");
  return mapKitchenOrders((data ?? []) as KitchenOrderRow[]);
}
