import Link from "next/link";
import {
  ArrowRight,
  Download,
  Eye,
  Info,
  Lightbulb,
  MousePointerClick,
  Play,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import { activeRestaurant } from "@/lib/permissions";
import { analyticsDateSeries, summarizeAnalytics } from "@/lib/analytics";
import {
  ANALYTICS_PERIODS,
  analyticsChange,
  analyticsGuidance,
  analyticsPeriodRange,
  parseAnalyticsPeriod,
  weeklySalesSummary,
} from "@/lib/analytics-report";
import { BackButton } from "@/components/ui/back-button";
import { AnalyticsGoals } from "@/components/dashboard/analytics-goals";
import { SalesFunnel } from "@/components/dashboard/sales-funnel";
import { DailyVisitsChart } from "@/components/dashboard/daily-visits-chart";
import { summarizeOrderAnalytics } from "@/lib/order-analytics";

const percentage = (value: number, total: number) =>
  total ? Math.round((value / total) * 100) : 0;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const days = parseAnalyticsPeriod((await searchParams).days);
  const range = analyticsPeriodRange(days);
  const { supabase, restaurant } = await activeRestaurant();
  const [
    { data, error },
    { data: goals },
    { data: orderRows, error: orderError },
  ] = await Promise.all([
    supabase
      .from("menu_analytics_daily")
      .select(
        "event_date,event_type,event_count,dimension_key,product_id,locale,products(name,category_id,categories(name))",
      )
      .eq("restaurant_id", restaurant.id)
      .gte("event_date", range.previousFrom)
      .lte("event_date", range.currentTo)
      .order("event_date"),
    supabase
      .from("restaurant_analytics_goals")
      .select("weekly_menu_views,weekly_cart_adds")
      .eq("restaurant_id", restaurant.id)
      .maybeSingle(),
    restaurant.ordering_enabled
      ? supabase
          .from("dining_orders")
          .select("status,subtotal_cents,created_at,accepted_at,delivered_at")
          .eq("restaurant_id", restaurant.id)
          .gte("created_at", `${range.previousFrom}T00:00:00.000Z`)
          .lte("created_at", `${range.currentTo}T23:59:59.999Z`)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (error || orderError)
    throw new Error(error?.message ?? orderError?.message);

  const rows = data ?? [];
  const summary = summarizeAnalytics(
    rows.filter((row) => row.event_date >= range.currentFrom),
  );
  const previous = summarizeAnalytics(
    rows.filter((row) => row.event_date <= range.previousTo),
  );
  const series = analyticsDateSeries(summary.days, days);
  const addRate = percentage(
    summary.totals.cartAdds,
    summary.totals.productViews,
  );
  const previousAddRate = percentage(
    previous.totals.cartAdds,
    previous.totals.productViews,
  );
  const productsPerVisit = summary.totals.menuViews
    ? Number(
        (summary.totals.productViews / summary.totals.menuViews).toFixed(1),
      )
    : 0;
  const guidance = analyticsGuidance(summary);
  const currentOrders = summarizeOrderAnalytics(
    (orderRows ?? []).filter(
      (row) => row.created_at >= `${range.currentFrom}T00:00:00.000Z`,
    ),
  );
  const previousOrders = summarizeOrderAnalytics(
    (orderRows ?? []).filter(
      (row) => row.created_at <= `${range.previousTo}T23:59:59.999Z`,
    ),
  );
  const weeklyRange = analyticsPeriodRange(7);
  const weeklySummary = summarizeAnalytics(
    rows.filter((row) => row.event_date >= weeklyRange.currentFrom),
  );
  const weekly = weeklySalesSummary(weeklySummary, restaurant.name);
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(weekly.text)}`;

  return (
    <main className="mx-auto max-w-7xl p-4 md:p-6">
      <header className="border-b border-stone-200 pb-5">
        <BackButton fallback="/dashboard" />
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-700">
              Analíticas del restaurante
            </p>
            <h1 className="mt-1 text-2xl font-extrabold md:text-3xl">
              ¿Qué está funcionando en tu carta?
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              <strong>Intención de compra, no ventas confirmadas.</strong> Aquí
              ves desde que alguien abre la carta hasta que añade un producto,
              comparado con el periodo anterior.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <nav
              aria-label="Periodo de analíticas"
              className="grid grid-cols-3 border border-stone-300 bg-white p-1"
            >
              {ANALYTICS_PERIODS.map((period) => (
                <Link
                  key={period}
                  href={`/dashboard/analytics?days=${period}`}
                  aria-current={period === days ? "page" : undefined}
                  className={`px-3 py-2 text-center text-xs font-bold ${period === days ? "bg-orange-600 text-white" : "text-slate-600 hover:bg-stone-100"}`}
                >
                  {period} días
                </Link>
              ))}
            </nav>
            <a
              href={`/api/dashboard/analytics/export?days=${days}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-stone-300 bg-white px-3 py-2 text-xs font-bold hover:bg-stone-100"
            >
              <Download size={15} />
              Descargar datos
            </a>
          </div>
        </div>
      </header>

      <section aria-labelledby="quick-summary" className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <h2 id="quick-summary" className="text-lg font-bold">
            Resumen de los últimos {days} días
          </h2>
          <Info size={16} className="text-slate-400" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <PrimaryMetric
            icon={<Eye />}
            label="Personas abrieron la carta"
            value={summary.totals.menuViews}
            previous={previous.totals.menuViews}
            explanation="Una visita cuenta cada apertura de la carta."
          />
          <PrimaryMetric
            icon={<UtensilsCrossed />}
            label="Productos vistos"
            value={summary.totals.productViews}
            previous={previous.totals.productViews}
            explanation={`${productsPerVisit} productos vistos por cada visita.`}
          />
          <PrimaryMetric
            icon={<ShoppingBag />}
            label="Productos añadidos"
            value={summary.totals.cartAdds}
            previous={previous.totals.cartAdds}
            explanation="Muestra intención de compra; no confirma una venta."
            emphasis
          />
          <PrimaryMetric
            icon={<TrendingUp />}
            label="Tasa de añadido"
            value={`${addRate}%`}
            current={addRate}
            previous={previousAddRate}
            explanation={`${addRate} de cada 100 productos vistos acabaron en el carrito.`}
          />
        </div>
      </section>

      <section
        className={`mt-5 border-l-4 p-5 ${guidance.tone === "positive" ? "border-emerald-600 bg-emerald-50" : "border-orange-500 bg-orange-50"}`}
      >
        <div className="flex items-start gap-3">
          <Lightbulb
            className={
              guidance.tone === "positive"
                ? "text-emerald-700"
                : "text-orange-700"
            }
            size={22}
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-600">
              Qué deberías hacer ahora
            </p>
            <h2 className="mt-1 text-lg font-bold">{guidance.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              {guidance.explanation}
            </p>
            <p className="mt-3 flex items-start gap-2 text-sm font-semibold">
              <ArrowRight className="mt-0.5 shrink-0" size={16} />
              {guidance.action}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,.55fr)]">
        <DailyVisitsChart series={series} />
        <aside className="space-y-4">
          <section className="border border-stone-200 bg-white p-5">
            <h2 className="font-bold">Cómo interactúan con la carta</h2>
            <p className="mt-1 text-xs text-slate-500">
              Estas acciones ayudan a entender qué despierta interés.
            </p>
            <div className="mt-4 divide-y divide-stone-100">
              <Interaction
                icon={<Play />}
                label="Vídeos iniciados"
                value={summary.totals.videoPlays}
              />
              <Interaction
                icon={<MousePointerClick />}
                label="Descripciones abiertas"
                value={summary.totals.detailOpens}
              />
              <Interaction
                icon={<Sparkles />}
                label="Añadidos por recomendación"
                value={summary.totals.recommendationAdds}
              />
            </div>
          </section>
          <section className="border border-stone-200 bg-white p-5">
            <h2 className="font-bold">Categorías que más venden</h2>
            <p className="mt-1 text-xs text-slate-500">
              Ordenadas por productos añadidos al carrito.
            </p>
            <div className="mt-4 space-y-3">
              {summary.categories.slice(0, 5).map((category, index) => (
                <Rank
                  key={category.id}
                  position={index + 1}
                  name={category.name}
                  value={category.cartAdds}
                  suffix={`${category.addRate}%`}
                />
              ))}
              {!summary.categories.length && <Empty />}
            </div>
          </section>
        </aside>
      </div>

      <SalesFunnel
        menuViews={summary.totals.menuViews}
        productViews={summary.totals.productViews}
        detailOpens={summary.totals.detailOpens}
        cartAdds={summary.totals.cartAdds}
      />

      <section className="mt-6 border border-stone-200 bg-white">
        <div className="border-b border-stone-200 p-5">
          <h2 className="font-bold">Productos que más interesan</h2>
          <p className="mt-1 text-xs text-slate-600">
            La tasa indica cuántos productos se añaden por cada 100
            visualizaciones.
          </p>
        </div>
        <div className="grid gap-3 p-4 md:hidden">
          {summary.products.map((item, index) => (
            <ProductCard
              key={item.id}
              item={item}
              position={index + 1}
              averageRate={addRate}
            />
          ))}
          {!summary.products.length && <Empty />}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Producto</th>
                <th className="px-4 py-3">Vistas</th>
                <th className="px-4 py-3">Vídeos</th>
                <th className="px-4 py-3">Descripciones</th>
                <th className="px-4 py-3">Añadidos</th>
                <th className="px-4 py-3">Tasa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {summary.products.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-3">
                    <strong>{item.name}</strong>
                    <p className="text-xs text-slate-500">
                      {item.categoryName}
                    </p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{item.views}</td>
                  <td className="px-4 py-3 tabular-nums">{item.videoPlays}</td>
                  <td className="px-4 py-3 tabular-nums">{item.detailOpens}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {item.cartAdds}
                    {item.recommendationAdds > 0 && (
                      <span className="ml-1 text-xs text-orange-700">
                        (+{item.recommendationAdds} sugeridos)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <RateBadge rate={item.addRate} average={addRate} />
                  </td>
                </tr>
              ))}
              {!summary.products.length && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Todavía no hay actividad de productos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {restaurant.ordering_enabled && (
        <section className="mt-6 border border-stone-200 bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-700">
              Menuly Comandas
            </p>
            <h2 className="mt-1 text-xl font-bold">
              Comandas enviadas a Cocina
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Son comandas reales; el importe no confirma que hayan sido
              cobradas.
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
            <OrderMetric
              label="Enviadas"
              value={String(currentOrders.submitted)}
              current={currentOrders.submitted}
              previous={previousOrders.submitted}
            />
            <OrderMetric
              label="Aceptadas"
              value={`${currentOrders.acceptanceRate}%`}
              current={currentOrders.acceptanceRate}
              previous={previousOrders.acceptanceRate}
            />
            <OrderMetric
              label="Entregadas"
              value={String(currentOrders.delivered)}
              current={currentOrders.delivered}
              previous={previousOrders.delivered}
            />
            <OrderMetric
              label="Tasa entrega"
              value={`${currentOrders.deliveryRate}%`}
              current={currentOrders.deliveryRate}
              previous={previousOrders.deliveryRate}
            />
            <OrderMetric
              label="Ticket medio"
              value={new Intl.NumberFormat("es-ES", {
                style: "currency",
                currency: restaurant.currency,
              }).format(currentOrders.averageTicketCents / 100)}
              current={currentOrders.averageTicketCents}
              previous={previousOrders.averageTicketCents}
            />
            <OrderMetric
              label="Tiempo medio"
              value={`${currentOrders.averageDeliveryMinutes} min`}
              current={currentOrders.averageDeliveryMinutes}
              previous={previousOrders.averageDeliveryMinutes}
            />
          </div>
        </section>
      )}

      {summary.totals.menuViews === 0 && (
        <div className="mt-6 border border-dashed border-stone-300 p-6 text-center">
          <p className="font-semibold">Aún no hay visitas en este periodo</p>
          <p className="mt-1 text-sm text-slate-500">
            Publica la carta y comparte su QR. Las estadísticas aparecerán
            automáticamente.
          </p>
        </div>
      )}

      <section className="mt-6 border-l-4 border-orange-500 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-700">
              Últimos 7 días
            </p>
            <h2 className="mt-1 text-lg font-bold">Resumen para compartir</h2>
            <p className="mt-1 text-xs text-slate-500">
              Una versión breve de la actividad semanal.
            </p>
          </div>
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
          >
            Compartir por WhatsApp
          </a>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <SummaryValue
            label="Visitas"
            value={String(weeklySummary.totals.menuViews)}
          />
          <SummaryValue
            label="Añadidos"
            value={String(weeklySummary.totals.cartAdds)}
          />
          <SummaryValue
            label="Producto destacado"
            value={weekly.topProduct?.name ?? "Sin datos"}
          />
        </div>
      </section>
      <AnalyticsGoals
        views={weeklySummary.totals.menuViews}
        adds={weeklySummary.totals.cartAdds}
        viewGoal={goals?.weekly_menu_views ?? 100}
        addGoal={goals?.weekly_cart_adds ?? 10}
      />
    </main>
  );
}

function ChangeBadge({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  const change = analyticsChange(current, previous);
  return (
    <span
      className={`text-[10px] font-bold ${change.tone === "up" ? "text-emerald-700" : change.tone === "down" ? "text-red-600" : "text-slate-500"}`}
    >
      {change.label}{" "}
      <span className="font-normal text-slate-400">
        frente al periodo anterior
      </span>
    </span>
  );
}
function PrimaryMetric({
  icon,
  label,
  value,
  current,
  previous,
  explanation,
  emphasis = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  current?: number;
  previous: number;
  explanation: string;
  emphasis?: boolean;
}) {
  const comparable = current ?? Number(value);
  return (
    <article
      className={`border p-4 shadow-sm ${emphasis ? "border-orange-300 bg-orange-50" : "border-stone-200 bg-white"}`}
    >
      <div className="flex items-center gap-2 text-orange-700">
        {icon}
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">
          {label}
        </h3>
      </div>
      <p className="mt-3 text-3xl font-black tabular-nums">{value}</p>
      <ChangeBadge current={comparable} previous={previous} />
      <p className="mt-3 border-t border-stone-200 pt-3 text-xs leading-relaxed text-slate-600">
        {explanation}
      </p>
    </article>
  );
}
function Interaction({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span className="text-orange-700">{icon}</span>
      <span className="min-w-0 flex-1 text-sm text-slate-700">{label}</span>
      <strong className="text-xl tabular-nums">{value}</strong>
    </div>
  );
}
function Rank({
  position,
  name,
  value,
  suffix,
}: {
  position: number;
  name: string;
  value: number;
  suffix: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center bg-stone-100 text-xs font-bold text-slate-600">
        {position}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm">{name}</span>
      <span className="text-right">
        <strong className="block text-sm tabular-nums">{value}</strong>
        <span className="text-[10px] text-slate-500">{suffix} tasa</span>
      </span>
    </div>
  );
}
function ProductCard({
  item,
  position,
  averageRate,
}: {
  item: ReturnType<typeof summarizeAnalytics>["products"][number];
  position: number;
  averageRate: number;
}) {
  return (
    <article className="border border-stone-200 bg-stone-50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center bg-white text-xs font-bold text-slate-600">
          {position}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold">{item.name}</h3>
          <p className="text-xs text-slate-500">{item.categoryName}</p>
        </div>
        <RateBadge rate={item.addRate} average={averageRate} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <SmallStat label="Vistas" value={item.views} />
        <SmallStat label="Detalles" value={item.detailOpens} />
        <SmallStat label="Añadidos" value={item.cartAdds} />
      </div>
    </article>
  );
}
function RateBadge({ rate, average }: { rate: number; average: number }) {
  return (
    <span
      className={`inline-flex min-w-12 justify-center px-2 py-1 text-xs font-bold ${rate >= average && rate > 0 ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-700"}`}
    >
      {rate}%
    </span>
  );
}
function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white p-2">
      <strong className="block tabular-nums">{value}</strong>
      <span className="text-[10px] text-slate-500">{label}</span>
    </div>
  );
}
function Empty() {
  return (
    <p className="py-4 text-sm text-slate-500">
      Todavía no hay suficiente actividad.
    </p>
  );
}
function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-stone-50 p-3">
      <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 truncate font-bold">{value}</p>
    </div>
  );
}
function OrderMetric({
  label,
  value,
  current,
  previous,
}: {
  label: string;
  value: string;
  current: number;
  previous: number;
}) {
  return (
    <div className="bg-stone-50 p-3">
      <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black tabular-nums">{value}</p>
      <ChangeBadge current={current} previous={previous} />
    </div>
  );
}
