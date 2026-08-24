import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { activeRestaurant } from "@/lib/permissions";
import { orderStatusSchema, type OrderStatus } from "@/lib/table-ordering";
import { OrderHistoryAction } from "@/components/dashboard/order-history-action";

type OrderRow = {
  id: string;
  status: string;
  subtotal_cents: number;
  customer_note: string | null;
  created_at: string;
  accepted_at: string | null;
  ready_at: string | null;
  delivered_at: string | null;
  restaurant_tables: { name?: string } | { name?: string }[] | null;
  dining_order_items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    note: string | null;
  }>;
};
const labels: Record<OrderStatus, string> = {
  pending: "Nuevo",
  accepted: "Aceptado",
  preparing: "En preparación",
  ready: "Listo",
  delivered: "Entregado",
  rejected: "Rechazado",
  cancelled: "Cancelado",
};
const filters = ["all", ...orderStatusSchema.options] as const;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { supabase, restaurant } = await activeRestaurant();
  if (!restaurant.ordering_enabled) return <Unavailable />;
  const requested = (await searchParams).status ?? "all";
  const status = filters.includes(requested as (typeof filters)[number])
    ? requested
    : "all";
  let query = supabase
    .from("dining_orders")
    .select(
      "id,status,subtotal_cents,customer_note,created_at,accepted_at,ready_at,delivered_at,restaurant_tables(name),dining_order_items(id,product_name,quantity,note)",
    )
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (status !== "all") query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const orders = (data ?? []) as OrderRow[];
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
  }).format(new Date());
  const todayOrders = orders.filter(
    (order) =>
      new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(
        new Date(order.created_at),
      ) === today,
  );
  const completed = todayOrders.filter((order) => order.status === "delivered");
  const sales = completed.reduce((sum, order) => sum + order.subtotal_cents, 0);
  return (
    <main className="mx-auto max-w-6xl p-4 md:p-6">
      <BackButton fallback="/dashboard" />
      <header className="mt-5 border-b border-stone-200 pb-5">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-700">
          Menuly Comandas
        </p>
        <h1 className="mt-1 text-3xl font-extrabold">Historial de comandas</h1>
        <p className="mt-2 text-sm text-slate-600">
          Últimas 100 comandas. Los importes registrados no representan cobros.
        </p>
      </header>
      <section className="mt-5 grid grid-cols-3 gap-3">
        <Metric label="Pedidos hoy" value={String(todayOrders.length)} />
        <Metric label="Entregados hoy" value={String(completed.length)} />
        <Metric
          label="Importe entregado"
          value={new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: restaurant.currency,
          }).format(sales / 100)}
        />
      </section>
      <nav
        aria-label="Filtrar pedidos"
        className="mt-5 flex gap-2 overflow-x-auto pb-2"
      >
        {filters.map((item) => (
          <Link
            key={item}
            href={
              item === "all"
                ? "/dashboard/orders"
                : `/dashboard/orders?status=${item}`
            }
            className={`shrink-0 border px-3 py-2 text-xs font-bold ${status === item ? "border-orange-600 bg-orange-600 text-white" : "border-stone-300 bg-white text-slate-700"}`}
          >
            {item === "all" ? "Todos" : labels[item]}
          </Link>
        ))}
      </nav>
      <section className="mt-3 space-y-3">
        {orders.map((order) => {
          const table = Array.isArray(order.restaurant_tables)
            ? order.restaurant_tables[0]
            : order.restaurant_tables;
          const parsed = orderStatusSchema.parse(order.status);
          return (
            <article
              key={order.id}
              className="border border-stone-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
                    #{order.id.slice(0, 6).toUpperCase()} ·{" "}
                    {table?.name ?? "Mesa"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Intl.DateTimeFormat("es-ES", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Europe/Madrid",
                    }).format(new Date(order.created_at))}
                  </p>
                </div>
                <span className="bg-stone-100 px-2 py-1 text-xs font-bold text-slate-700">
                  {labels[parsed]}
                </span>
              </div>
              <ul className="mt-3 border-y border-stone-100 py-3 text-sm">
                {order.dining_order_items.map((item) => (
                  <li key={item.id} className="py-1">
                    <strong>
                      {item.quantity}× {item.product_name}
                    </strong>
                    {item.note && (
                      <span className="ml-2 text-xs text-amber-800">
                        {item.note}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-end justify-between gap-3">
                {order.customer_note ? (
                  <p className="text-xs text-slate-600">
                    Nota: {order.customer_note}
                  </p>
                ) : (
                  <span />
                )}
                <strong>
                  {new Intl.NumberFormat("es-ES", {
                    style: "currency",
                    currency: restaurant.currency,
                  }).format(order.subtotal_cents / 100)}
                </strong>
              </div>
              {(parsed === "rejected" || parsed === "cancelled") && (
                <OrderHistoryAction orderId={order.id} />
              )}
            </article>
          );
        })}
        {!orders.length && (
          <div className="border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-slate-500">
            No hay pedidos con este estado.
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-stone-200 bg-white p-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black tabular-nums md:text-2xl">
        {value}
      </p>
    </div>
  );
}
function Unavailable() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <BackButton fallback="/dashboard" />
      <section className="mt-6 border border-stone-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-bold">Menuly Comandas no está activo</h1>
        <p className="mt-2 text-sm text-slate-600">
          Activa el módulo para consultar el historial de comandas.
        </p>
      </section>
    </main>
  );
}
