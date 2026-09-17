import Link from "next/link";
import { activeRestaurant } from "@/lib/permissions";
import { orderStatusSchema, type OrderStatus } from "@/lib/table-ordering";
import { OrderHistoryAction } from "@/components/dashboard/order-history-action";
import {OrderHistoryItems,type OrderHistoryItem} from "@/components/dashboard/order-history-items";

type OrderRow = {
  id: string;
  status: string;
  fulfillment: "table"|"pickup";
  order_source: string;
  payment_timing: string;
  pos_reference: string|null;
  payment_status: "paid"|"unpaid";
  subtotal_cents: number;
  customer_note: string | null;
  created_at: string;
  accepted_at: string | null;
  ready_at: string | null;
  delivered_at: string | null;
  restaurant_tables: { name?: string } | { name?: string }[] | null;
  dining_order_items: OrderHistoryItem[];
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
      "id,status,fulfillment,payment_status,order_source,payment_timing,pos_reference,subtotal_cents,customer_note,created_at,accepted_at,ready_at,delivered_at,restaurant_tables(name),dining_order_items(id,product_name,quantity,unit_price_cents,line_total_cents,note,selected_options)",
    )
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (status !== "all") query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const orders = (data ?? []) as OrderRow[];
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: restaurant.timezone??"Europe/Madrid",
  }).format(new Date());
  const todayOrders = orders.filter(
    (order) =>
      new Intl.DateTimeFormat("en-CA", { timeZone: restaurant.timezone??"Europe/Madrid" }).format(
        new Date(order.created_at),
      ) === today,
  );
  const completed = todayOrders.filter((order) => order.status === "delivered");
  const sales = completed.reduce((sum, order) => sum + order.subtotal_cents, 0);
  return (
    <main className="mx-auto max-w-6xl p-4 md:p-6">
      <header className="border-b border-stone-200 pb-5">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-700">
          Menuly Comandas
        </p>
        <h1 className="mt-1 text-3xl font-extrabold">Historial de comandas</h1>
        <p className="mt-2 text-sm text-slate-600">
          Últimas 100 comandas. Abre un pedido para consultar sus productos, opciones y cobro.
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
            <details
              key={order.id}
              className="border border-stone-200 bg-white p-4 shadow-sm"
            >
              <summary className="flex cursor-pointer flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
                    #{order.id.slice(0, order.fulfillment==="pickup"||order.order_source==="table_qr"?8:6).toUpperCase()} ·{" "}
                    {order.fulfillment==="pickup"?"Recogida":table?.name ?? "Mesa"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Intl.DateTimeFormat("es-ES", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: restaurant.timezone??"Europe/Madrid",
                    }).format(new Date(order.created_at))}
                  </p>
                </div>
                <span className="bg-stone-100 px-2 py-1 text-xs font-bold text-slate-700">
                  {labels[parsed]}
                  {` · ${order.payment_status==="paid"?"Cobro registrado":"Sin cobrar"}`}<span className="ml-3">Ver detalle ↓</span>
                </span>
              </summary>
              <OrderHistoryItems items={order.dining_order_items} currency={restaurant.currency}/>
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
              <p className="mt-3 text-xs text-slate-600">Pago {order.payment_timing==="before"?"antes de preparar":"después"}{order.pos_reference&&` · Ticket TPV: ${order.pos_reference}`}</p>
              {(parsed === "rejected" || parsed === "cancelled") && (
                <OrderHistoryAction orderId={order.id} />
              )}
            </details>
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
      <section className="border border-stone-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-bold">Menuly Comandas no está activo</h1>
        <p className="mt-2 text-sm text-slate-600">
          Activa el módulo para consultar el historial de comandas.
        </p>
      </section>
    </main>
  );
}
