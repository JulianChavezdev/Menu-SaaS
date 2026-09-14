import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  Palette,
  QrCode,
  UtensilsCrossed,
  ChefHat,
} from "lucide-react";
import {
  WorkspaceHeading,
  WorkspaceMetric,
} from "@/components/dashboard/workspace-ui";
import { subscriptionHasAccess } from "@/lib/plans";
import { activeRestaurant } from "@/lib/permissions";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { ActionCenter } from "@/components/dashboard/action-center";
import { restaurantAlerts } from "@/lib/restaurant-alerts";
import { trialDaysRemaining, signupPlanName } from "@/lib/signup-plans";

export default async function Dashboard() {
  const { restaurant, supabase } = await activeRestaurant();

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 6);
  const [
    { count: products },
    { count: categories },
    { count: videos },
    { count: media },
    { count: productsWithoutMedia },
    { data: subscription },
    { data: analytics },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id),
    supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id)
      .not("video_url", "is", null),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id)
      .or("video_url.not.is.null,image_url.not.is.null"),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id)
      .is("video_url", null)
      .is("image_url", null),
    supabase
      .from("subscriptions")
      .select("plan,status,current_period_end")
      .eq("restaurant_id", restaurant.id)
      .maybeSingle(),
    supabase
      .from("menu_analytics_daily")
      .select("event_type,event_count")
      .eq("restaurant_id", restaurant.id)
      .gte("event_date", since.toISOString().slice(0, 10)),
  ]);
  const eventTotal = (type: string) =>
    (analytics ?? [])
      .filter((row) => row.event_type === type)
      .reduce((total, row) => total + Number(row.event_count || 0), 0);
  const status = subscription?.status ?? restaurant.subscription_status;
  const trialDays =
    subscription?.status === "trialing" && subscription.current_period_end
      ? trialDaysRemaining(subscription.current_period_end)
      : null;
  const alerts = restaurantAlerts({
    subscriptionStatus: status,
    published: restaurant.is_published,
    products: products ?? 0,
    productsWithoutMedia: productsWithoutMedia ?? 0,
    menuViews: eventTotal("menu_view"),
    cartAdds: eventTotal("cart_add"),
    recommendationAdds: eventTotal("recommendation_add"),
    hasLogo: Boolean(restaurant.logo_url),
    hasContact: Boolean(restaurant.phone || restaurant.address),
  });

  const published = restaurant.is_published && subscriptionHasAccess(status);
  const coverage = products ? Math.round(((media ?? 0) / products) * 100) : 0;
  const tools = [
    {
      href: "/dashboard/menu",
      title: "Editar la carta",
      description: "Productos, precios y disponibilidad.",
      icon: BookOpen,
    },
    {
      href: "/dashboard/appearance",
      title: "Apariencia",
      description: "Plantilla, imágenes e idiomas.",
      icon: Palette,
    },
    {
      href: "/dashboard/qr",
      title: "Código QR",
      description: "Descarga el acceso a tu carta.",
      icon: QrCode,
    },
  ];
  return (
    <main className="workspace-page">
      <WorkspaceHeading
        eyebrow={restaurant.name}
        title="Resumen"
        description="La actividad de tu carta y lo que necesita atención."
        actions={
          <>
            <a
              href={`/r/${restaurant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="workspace-button"
            >
              <ExternalLink size={14} />
              Ver carta
            </a>
            <Link
              href="/dashboard/menu"
              className="workspace-button workspace-button-primary"
            >
              Editar carta
              <ArrowRight size={14} />
            </Link>
          </>
        }
      />
      <div className="mb-4 flex items-center justify-between gap-4">
        <span
          className="workspace-status"
          data-state={published ? "active" : "inactive"}
        >
          {published
            ? "Carta publicada"
            : subscriptionHasAccess(status)
              ? "Carta en borrador"
              : "Pendiente de activación"}
        </span>
        <span className="text-xs text-slate-500">
          Actividad · últimos 7 días
        </span>
      </div>
      <section aria-label="Resumen de la carta" className="workspace-metrics">
        <WorkspaceMetric
          label="Visitas a la carta"
          value={eventTotal("menu_view")}
          note="Aperturas durante esta semana"
        />
        <WorkspaceMetric
          label="Añadidos al carrito"
          value={eventTotal("cart_add")}
          note="Intención de compra, no ventas"
        />
        <WorkspaceMetric
          label="Productos"
          value={products ?? 0}
          note={`${categories ?? 0} categorías en tu carta`}
        />
        <WorkspaceMetric
          label="Contenido visual"
          value={`${coverage}%`}
          note={`${media ?? 0} con foto o vídeo · ${videos ?? 0} vídeos`}
        />
      </section>
      {trialDays !== null && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-stone-200 bg-white px-5 py-4">
          <p className="text-xs text-slate-600">
            Prueba de{" "}
            {signupPlanName(
              restaurant.signup_plan_interest ?? subscription?.plan,
            )}{" "}
            ·{" "}
            <strong className="font-medium">
              {trialDays === 0 ? "Termina hoy" : `${trialDays} días restantes`}
            </strong>
          </p>
          <Link href="/dashboard/billing" className="workspace-text-link">
            Ver suscripción
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
      <div className="workspace-grid">
        <section className="workspace-panel">
          <div className="workspace-section-header">
            <div>
              <h2>Gestiona tu carta</h2>
              <p>Los accesos que necesitas a diario.</p>
            </div>
          </div>
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="workspace-list-item"
            >
              <tool.icon
                className="workspace-list-icon"
                size={21}
                strokeWidth={1.5}
              />
              <div>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
              </div>
              <ArrowRight className="workspace-list-arrow" size={16} />
            </Link>
          ))}
          <div className="flex items-center justify-between gap-4 border-t border-stone-200 bg-stone-50/40 px-6 py-4">
            <p className="text-xs text-slate-500">
              Consulta qué productos despiertan más interés.
            </p>
            <Link
              href="/dashboard/analytics"
              className="workspace-text-link whitespace-nowrap"
            >
              Ver analíticas
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
        <ActionCenter alerts={alerts} />
      </div>
      {restaurant.ordering_enabled && (
        <section className="workspace-panel mt-6">
          <div className="workspace-section-header">
            <div>
              <h2>Durante el servicio</h2>
              <p>Comandero y cocina, conectados a tu carta.</p>
            </div>
            <Link href="/dashboard/orders" className="workspace-text-link">
              Historial
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid md:grid-cols-2">
            <a href="/operaciones/comandero" className="workspace-list-item">
              <UtensilsCrossed className="workspace-list-icon" size={21} />
              <div>
                <h3>Abrir comandero</h3>
                <p>Mesas y nuevas comandas.</p>
              </div>
              <ArrowRight className="workspace-list-arrow" size={16} />
            </a>
            <a href="/operaciones/cocina" className="workspace-list-item">
              <ChefHat className="workspace-list-icon" size={21} />
              <div>
                <h3>Abrir cocina</h3>
                <p>Preparación y entrega de pedidos.</p>
              </div>
              <ArrowRight className="workspace-list-arrow" size={16} />
            </a>
          </div>
        </section>
      )}
      <OnboardingChecklist
        input={{
          hasLogo: Boolean(restaurant.logo_url),
          hasContact: Boolean(restaurant.phone || restaurant.address),
          categories: categories ?? 0,
          products: products ?? 0,
          media: media ?? 0,
          published,
        }}
      />
    </main>
  );
}
