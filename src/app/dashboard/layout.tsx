import Link from "next/link";
import type { Metadata } from "next";
import { activeRestaurant } from "@/lib/permissions";
import { RestaurantSwitcher } from "@/components/dashboard/restaurant-switcher";
import { SignOut } from "@/components/dashboard/sign-out";
import { DashboardNavigation } from "@/components/dashboard/dashboard-navigation";
import { isSuperadminUser } from "@/lib/superadmin";
import { BrandLogo } from "@/components/brand/brand-logo";
import { redirect } from "next/navigation";
import { isOperationalRole, memberHome } from "@/lib/member-roles";
import { ExternalLink, BookOpen } from "lucide-react";
import { cookies } from "next/headers";
import { DashboardTheme, DashboardThemeToggle } from "@/components/dashboard/dashboard-theme";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false, follow: false },
};
const links = [
  ["Inicio", "/dashboard"],
  ["Carta", "/dashboard/menu"],
  ["Apariencia", "/dashboard/appearance"],
  ["Analíticas", "/dashboard/analytics"],
  ["Restaurante", "/dashboard/restaurant"],
  ["Equipo", "/dashboard/members"],
  ["Código QR", "/dashboard/qr"],
  ["Suscripción", "/dashboard/billing"],
] as const;
const orderingLinks = [
  ["Recogidas QR", "/dashboard/pickup"],
  ["Caja", "/operaciones/caja"],
  ["Mesas", "/dashboard/tables"],
  ["Historial", "/dashboard/orders"],
  ["Comandero", "/operaciones/comandero"],
  ["Cocina", "/operaciones/cocina"],
] as const;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user, restaurant, member } = await activeRestaurant();
  const initialTheme = (await cookies()).get("menuly-dashboard-theme")?.value === "light" ? "light" : "dark";
  if (isOperationalRole(member.role)) redirect(memberHome(member.role));
  const { data: members } = await supabase
    .from("restaurant_members")
    .select("restaurant_id,restaurants(id,name)")
    .eq("user_id", user.id);
  const items = (members ?? []).map(
    (member) => member.restaurants as unknown as { id: string; name: string },
  );
  const restaurantNavigation = restaurant.ordering_enabled
    ? [...links, ...orderingLinks]
    : [...links];
  const navigation = isSuperadminUser(user)
    ? [...restaurantNavigation, ["Superadmin", "/superadmin"] as const]
    : restaurantNavigation;
  return (
    <DashboardTheme initialTheme={initialTheme}>
      <a href="#panel-content" className="workspace-skip">
        Saltar al contenido
      </a>
      <aside className="workspace-sidebar">
        <div className="workspace-brand">
          <Link
            href="/dashboard"
            prefetch
            aria-label="Menuly · Panel"
            className="inline-flex items-center"
          >
            <BrandLogo priority className="w-[106px]" />
          </Link>
          <div className="flex items-center gap-1">
            <DashboardThemeToggle />
            <span className="md:hidden"><SignOut compact /></span>
          </div>
        </div>
        {items.length > 1 && (
          <div className="mt-3 max-w-full overflow-hidden text-sm md:hidden">
            <RestaurantSwitcher activeId={restaurant.id} items={items} />
          </div>
        )}
        <div className="workspace-restaurant">
          <span className="workspace-restaurant-initial" aria-hidden="true">
            {restaurant.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-semibold"
              title={restaurant.name}
            >
              {restaurant.name}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Panel del restaurante
            </p>
            <RestaurantSwitcher activeId={restaurant.id} items={items} />
          </div>
        </div>
        <DashboardNavigation links={navigation} />
        <div className="workspace-sidebar-footer">
          <a
            href={`/r/${restaurant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={16} />
            Ver carta pública
          </a>
          <a
            href="/manual-menuly-restaurantes.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            <BookOpen size={16} />
            Ayuda y manual
          </a>
          <SignOut />
        </div>
      </aside>
      <div id="panel-content" tabIndex={-1} className="min-w-0 outline-none">
        {children}
      </div>
    </DashboardTheme>
  );
}
