import Link from "next/link";
import {
  ArrowRight,
  Download,
  Info,
  MousePointerClick,
  Play,
  ShoppingBag,
} from "lucide-react";
import {
  WorkspaceHeading,
  WorkspaceMetric,
} from "@/components/dashboard/workspace-ui";
import { AnalyticsProducts } from "@/components/dashboard/analytics-products";
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

  const dateLabel = (value: string) =>
    new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }).format(new Date(`${value}T00:00:00Z`));
  return (
    <main className="workspace-page">
      <WorkspaceHeading
        eyebrow={restaurant.name}
        title="Analíticas"
        description={`${dateLabel(range.currentFrom)} – ${dateLabel(range.currentTo)} · Comparado con los ${days} días anteriores.`}
        actions={
          <>
            <nav
              aria-label="Periodo de analíticas"
              className="workspace-periods"
            >
              {ANALYTICS_PERIODS.map((period) => (
                <Link
                  key={period}
                  href={`/dashboard/analytics?days=${period}`}
                  aria-current={period === days ? "page" : undefined}
                >
                  {period} días
                </Link>
              ))}
            </nav>
            <a
              href={`/api/dashboard/analytics/export?days=${days}`}
              className="workspace-button"
            >
              <Download size={14} />
              Exportar CSV
            </a>
          </>
        }
      />
      <section
        aria-label={`Resumen de los últimos ${days} días`}
        className="workspace-metrics"
      >
        <WorkspaceMetric
          label="Visitas a la carta"
          value={summary.totals.menuViews}
          note="Cada apertura cuenta como una visita"
        >
          <ChangeBadge
            current={summary.totals.menuViews}
            previous={previous.totals.menuViews}
          />
        </WorkspaceMetric>
        <WorkspaceMetric
          label="Productos vistos"
          value={summary.totals.productViews}
          note={`${productsPerVisit.toLocaleString("es-ES")} visualizaciones por visita`}
        >
          <ChangeBadge
            current={summary.totals.productViews}
            previous={previous.totals.productViews}
          />
        </WorkspaceMetric>
        <WorkspaceMetric
          label="Añadidos al carrito"
          value={summary.totals.cartAdds}
          note="Interés en un producto, no una venta"
        >
          <ChangeBadge
            current={summary.totals.cartAdds}
            previous={previous.totals.cartAdds}
          />
        </WorkspaceMetric>
        <WorkspaceMetric
          label="Tasa de añadido"
          value={`${addRate}%`}
          note="Añadidos por cada 100 visualizaciones"
        >
          <ChangeBadge current={addRate} previous={previousAddRate} points />
        </WorkspaceMetric>
      </section>
      <p className="workspace-note">
        <Info size={13} />
        Una visita cuenta cada apertura, no una persona única. Un añadido al
        carrito no confirma una venta.
      </p>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(260px,1fr)]">
        <div className="workspace-panel">
          <DailyVisitsChart series={series} />
          <div className="workspace-insight">
            <p className="workspace-eyebrow">Lectura del periodo</p>
            <h2>{guidance.title}</h2>
            <p>{guidance.explanation}</p>
            <p className="flex items-start gap-2">
              <ArrowRight size={13} className="mt-1 shrink-0" />
              {guidance.action}
            </p>
          </div>
        </div>
        <aside className="workspace-panel">
          <div className="workspace-section-header">
            <div>
              <h2>Actividad en la carta</h2>
              <p>Qué consultan tus clientes.</p>
            </div>
          </div>
          <div className="px-6 py-2">
            <Interaction
              icon={<Play size={15} />}
              label="Vídeos iniciados"
              value={summary.totals.videoPlays}
            />
            <Interaction
              icon={<MousePointerClick size={15} />}
              label="Detalles abiertos"
              value={summary.totals.detailOpens}
            />
            <Interaction
              icon={<ShoppingBag size={15} />}
              label="Añadidos sugeridos"
              value={summary.totals.recommendationAdds}
            />
          </div>
          <div className="workspace-section-header border-t">
            <div>
              <h2>Categorías con más interés</h2>
              <p>Ordenadas por añadidos al carrito.</p>
            </div>
          </div>
          <div className="space-y-5 px-6 py-5">
            {summary.categories.slice(0, 5).map((category, index) => (
              <div key={category.id} className="flex items-center gap-3">
                <span className="w-3 text-[10px] tabular-nums text-slate-400">
                  {index + 1}
                </span>
                <span
                  className="min-w-0 flex-1 truncate text-xs"
                  title={category.name}
                >
                  {category.name}
                </span>
                <div className="text-right">
                  <strong className="text-sm font-medium tabular-nums">
                    {category.cartAdds.toLocaleString("es-ES")}
                  </strong>
                  <p className="text-[10px] text-slate-500">añadidos</p>
                </div>
              </div>
            ))}
            {!summary.categories.length && (
              <p className="text-xs leading-6 text-slate-500">
                Las categorías aparecerán cuando tu carta reciba actividad.
              </p>
            )}
          </div>
        </aside>
      </div>
      <AnalyticsProducts products={summary.products} />
      {restaurant.ordering_enabled && (
        <section className="workspace-panel mt-6">
          <div className="workspace-section-header">
            <div>
              <h2>Servicio y comandas</h2>
              <p>
                Comandas reales. Los importes no confirman que hayan sido
                cobrados.
              </p>
            </div>
            <Link href="/dashboard/orders" className="workspace-text-link">
              Ver historial
              <ArrowRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-2 divide-x divide-stone-100 lg:grid-cols-3">
            <WorkspaceMetric
              label="Comandas enviadas"
              value={currentOrders.submitted}
            >
              <ChangeBadge
                current={currentOrders.submitted}
                previous={previousOrders.submitted}
              />
            </WorkspaceMetric>
            <WorkspaceMetric
              label="Comandas entregadas"
              value={currentOrders.delivered}
              note={`${currentOrders.deliveryRate}% del total`}
            >
              <ChangeBadge
                current={currentOrders.delivered}
                previous={previousOrders.delivered}
              />
            </WorkspaceMetric>
            <WorkspaceMetric
              label="Ticket medio"
              value={new Intl.NumberFormat("es-ES", {
                style: "currency",
                currency: restaurant.currency,
              }).format(currentOrders.averageTicketCents / 100)}
            >
              <ChangeBadge
                current={currentOrders.averageTicketCents}
                previous={previousOrders.averageTicketCents}
              />
            </WorkspaceMetric>
            <WorkspaceMetric
              label="Tiempo medio de entrega"
              value={`${currentOrders.averageDeliveryMinutes} min`}
            >
              <ChangeBadge
                current={currentOrders.averageDeliveryMinutes}
                previous={previousOrders.averageDeliveryMinutes}
                lowerIsBetter
              />
            </WorkspaceMetric>
            <WorkspaceMetric
              label="Tasa de aceptación"
              value={`${currentOrders.acceptanceRate}%`}
            >
              <ChangeBadge
                current={currentOrders.acceptanceRate}
                previous={previousOrders.acceptanceRate}
                points
              />
            </WorkspaceMetric>
            <WorkspaceMetric
              label="Tasa de entrega"
              value={`${currentOrders.deliveryRate}%`}
            >
              <ChangeBadge
                current={currentOrders.deliveryRate}
                previous={previousOrders.deliveryRate}
                points
              />
            </WorkspaceMetric>
          </div>
        </section>
      )}
      <details className="workspace-disclosure">
        <summary>Recorrido de la carta y objetivos semanales</summary>
        <SalesFunnel
          menuViews={summary.totals.menuViews}
          productViews={summary.totals.productViews}
          detailOpens={summary.totals.detailOpens}
          cartAdds={summary.totals.cartAdds}
        />
        <AnalyticsGoals
          views={weeklySummary.totals.menuViews}
          adds={weeklySummary.totals.cartAdds}
          viewGoal={goals?.weekly_menu_views ?? 100}
          addGoal={goals?.weekly_cart_adds ?? 10}
        />
      </details>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-stone-200 pt-5">
        <div>
          <h2 className="text-sm">Resumen semanal</h2>
          <p className="mt-1 text-xs text-slate-500">
            Últimos 7 días ·{" "}
            {weeklySummary.totals.menuViews.toLocaleString("es-ES")} visitas ·{" "}
            {weeklySummary.totals.cartAdds.toLocaleString("es-ES")} añadidos
          </p>
        </div>
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="workspace-button"
        >
          Compartir por WhatsApp
          <ArrowRight size={13} />
        </a>
      </div>
    </main>
  );
}

function ChangeBadge({
  current,
  previous,
  points = false,
  lowerIsBetter = false,
}: {
  current: number;
  previous: number;
  points?: boolean;
  lowerIsBetter?: boolean;
}) {
  const change = analyticsChange(current, previous);
  const tone = lowerIsBetter
    ? change.tone === "up"
      ? "down"
      : change.tone === "down"
        ? "up"
        : "flat"
    : change.tone;
  const difference = current - previous;
  const label = points
    ? `${difference > 0 ? "+" : ""}${difference} pp`
    : change.label;
  return (
    <span className="workspace-change" data-tone={tone}>
      {label}
      <small>vs. periodo anterior</small>
    </span>
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
    <div className="flex items-center gap-3 border-b border-stone-100 py-4 last:border-0">
      <span className="text-slate-400">{icon}</span>
      <span className="min-w-0 flex-1 text-xs text-slate-600">{label}</span>
      <strong className="text-sm font-medium tabular-nums">
        {value.toLocaleString("es-ES")}
      </strong>
    </div>
  );
}
