"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { activeRestaurant } from "@/lib/permissions";
import { canTransitionOrder, orderStatusSchema } from "@/lib/table-ordering";
import { canUseKitchen } from "@/lib/member-roles";
import { getSupabaseSecretKey } from "@/lib/supabase/admin-env";

const uuid = z.string().uuid();
const tableName = z.string().trim().min(1).max(40);

async function orderingRestaurant(operation: "manage" | "kitchen" = "manage") {
  const context = await activeRestaurant();
  const allowed = operation === "kitchen"
    ? canUseKitchen(context.member.role)
    : ["owner", "admin", "editor"].includes(context.member.role);
  if (!allowed) throw new Error("No tienes permisos para realizar esta acción.");
  if (
    !context.restaurant.ordering_enabled ||
    !["active", "trialing"].includes(context.restaurant.subscription_status)
  )
    throw new Error("Menuly Comandas no está activo para este restaurante.");
  return context;
}

function refresh() {
  revalidatePath("/dashboard/tables");
  revalidatePath("/dashboard/pos");
  revalidatePath("/dashboard/kitchen");
  revalidatePath("/operaciones/comandero");
  revalidatePath("/operaciones/cocina");
}

export async function createDiningTable(form: FormData) {
  const parsed = tableName.safeParse(form.get("name"));
  if (!parsed.success) throw new Error("Escribe un nombre de mesa válido.");
  const { supabase, restaurant } = await orderingRestaurant();
  const { count } = await supabase
    .from("restaurant_tables")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurant.id);
  if ((count ?? 0) >= 100)
    throw new Error("Has alcanzado el máximo de 100 mesas.");
  const { error } = await supabase.from("restaurant_tables").insert({
    restaurant_id: restaurant.id,
    name: parsed.data,
    sort_order: count ?? 0,
  });
  if (error)
    throw new Error(
      error.code === "23505"
        ? "Ya existe una mesa con ese nombre."
        : error.message,
    );
  refresh();
}

export async function setDiningTableActive(form: FormData) {
  const parsed = uuid.safeParse(form.get("table_id"));
  if (!parsed.success) throw new Error("Mesa no válida.");
  const { supabase, restaurant } = await orderingRestaurant();
  const active = form.get("active") === "true";
  if (!active)
    await supabase
      .from("table_sessions")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("table_id", parsed.data)
      .eq("restaurant_id", restaurant.id)
      .eq("status", "open");
  const { error } = await supabase
    .from("restaurant_tables")
    .update({ is_active: active })
    .eq("id", parsed.data)
    .eq("restaurant_id", restaurant.id);
  if (error) throw new Error(error.message);
  refresh();
}

export async function transitionDiningOrder(
  orderId: string,
  nextStatus: string,
) {
  const order = uuid.safeParse(orderId);
  const next = orderStatusSchema.safeParse(nextStatus);
  if (!order.success || !next.success) throw new Error("Pedido no válido.");
  const { restaurant } = await orderingRestaurant("kitchen");
  const key = getSupabaseSecretKey();
  if (!key) throw new Error("Cocina no está disponible.");
  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: current, error: readError } = await admin
    .from("dining_orders")
    .select("status,table_session_id")
    .eq("id", order.data)
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();
  if (readError || !current) throw new Error("Pedido no encontrado.");
  const from = orderStatusSchema.parse(current.status);
  if (!canTransitionOrder(from, next.data))
    throw new Error("Ese cambio de estado no está permitido.");
  const now = new Date().toISOString();
  const timestamps =
    next.data === "pending"
      ? { accepted_at: null, ready_at: null, delivered_at: null }
      : next.data === "accepted"
        ? { accepted_at: now }
        : next.data === "ready"
          ? { ready_at: now }
          : next.data === "delivered"
            ? { delivered_at: now }
            : {};
  const { data: updated, error } = await admin
    .from("dining_orders")
    .update({ status: next.data, ...timestamps })
    .eq("id", order.data)
    .eq("restaurant_id", restaurant.id)
    .eq("status", from)
    .select("id")
    .maybeSingle();
  if (error || !updated)
    throw new Error("El pedido ya cambió de estado. Actualiza la pantalla.");
  refresh();
}
