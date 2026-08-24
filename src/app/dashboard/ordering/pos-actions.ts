"use server";

import { revalidatePath } from "next/cache";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { z } from "zod";
import { activeRestaurant } from "@/lib/permissions";
import { getSupabaseSecretKey } from "@/lib/supabase/admin-env";
import { canUseWaiter } from "@/lib/member-roles";

const staffOrderSchema = z.object({
  tableId: z.string().uuid(),
  requestId: z.string().uuid(),
  note: z.string().trim().max(300).default(""),
  lines: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
        note: z.string().trim().max(300).default(""),
      }),
    )
    .min(1)
    .max(50),
});

export type StaffOrderInput = z.input<typeof staffOrderSchema>;

export async function createStaffDiningOrder(input: StaffOrderInput) {
  const parsed = staffOrderSchema.safeParse(input);
  if (!parsed.success) throw new Error("Revisa la comanda antes de enviarla.");
  if (
    new Set(parsed.data.lines.map((line) => line.productId)).size !==
    parsed.data.lines.length
  )
    throw new Error("Hay productos duplicados en la comanda.");

  const { restaurant, user, member } = await activeRestaurant();
  if (!canUseWaiter(member.role)) throw new Error("No tienes acceso al comandero.");
  if (
    !restaurant.ordering_enabled ||
    !["active", "trialing"].includes(restaurant.subscription_status)
  )
    throw new Error("Menuly Comandas no está activo.");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getSupabaseSecretKey();
  if (!url || !key) throw new Error("El comandero no está disponible.");
  const admin = createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: table } = await admin
    .from("restaurant_tables")
    .select("id,name,is_active")
    .eq("id", parsed.data.tableId)
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();
  if (!table?.is_active) throw new Error("La mesa no está disponible.");

  const productIds = parsed.data.lines.map((line) => line.productId);
  const { data: products, error: productsError } = await admin
    .from("products")
    .select("id,name,price_cents,is_available,categories!inner(is_active)")
    .eq("restaurant_id", restaurant.id)
    .in("id", productIds)
    .eq("is_available", true)
    .eq("categories.is_active", true);
  if (productsError || products?.length !== productIds.length)
    throw new Error("Algún producto ya no está disponible.");

  const now = new Date();
  await admin
    .from("table_sessions")
    .update({ status: "expired", closed_at: now.toISOString() })
    .eq("restaurant_id", restaurant.id)
    .eq("table_id", table.id)
    .eq("status", "open")
    .lte("expires_at", now.toISOString());

  let { data: session } = await admin
    .from("table_sessions")
    .select("id")
    .eq("restaurant_id", restaurant.id)
    .eq("table_id", table.id)
    .eq("status", "open")
    .gt("expires_at", now.toISOString())
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!session) {
    const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const created = await admin
      .from("table_sessions")
      .insert({
        restaurant_id: restaurant.id,
        table_id: table.id,
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
      })
      .select("id")
      .maybeSingle();
    if (created.error?.code === "23505") {
      const existing = await admin
        .from("table_sessions")
        .select("id")
        .eq("restaurant_id", restaurant.id)
        .eq("table_id", table.id)
        .eq("status", "open")
        .maybeSingle();
      session = existing.data;
    } else if (created.error) throw new Error(created.error.message);
    else session = created.data;
  }
  if (!session) throw new Error("No se pudo preparar la mesa.");

  const byId = new Map(products.map((product) => [product.id, product]));
  const items = parsed.data.lines.map((line) => {
    const product = byId.get(line.productId)!;
    return {
      restaurant_id: restaurant.id,
      product_id: product.id,
      product_name: product.name,
      unit_price_cents: product.price_cents,
      quantity: line.quantity,
      note: line.note || null,
      line_total_cents: product.price_cents * line.quantity,
    };
  });
  const subtotal = items.reduce((sum, item) => sum + item.line_total_cents, 0);
  const { data: result, error } = await admin.rpc(
    "create_public_dining_order",
    {
      target_restaurant: restaurant.id,
      target_table: table.id,
      target_session: session.id,
      target_request: parsed.data.requestId,
      target_subtotal: subtotal,
      target_customer_note: parsed.data.note,
      target_items: items,
    },
  );
  const order = Array.isArray(result) ? result[0] : result;
  if (error || !order) throw new Error("No se pudo enviar la comanda.");

  revalidatePath("/dashboard/kitchen");
  revalidatePath("/operaciones/cocina");
  revalidatePath("/dashboard/orders");
  return {
    id: order.order_id as string,
    number: String(order.order_id).slice(0, 6).toUpperCase(),
    tableName: table.name,
    subtotalCents: subtotal,
  };
}
