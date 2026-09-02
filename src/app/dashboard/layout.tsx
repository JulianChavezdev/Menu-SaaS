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
    <div className="dashboard-light menuly-app min-h-screen bg-[#f4f1eb] text-slate-950 md:grid md:grid-cols-[248px_1fr]">
      <aside className="menuly-sidebar border-b border-stone-200 bg-white p-4 shadow-sm md:sticky md:top-0 md:flex md:h-screen md:flex-col md:border-b-0 md:border-r md:p-5">
        <div className="flex items-center justify-between gap-3 md:block">
          <Link
            href="/dashboard"
            prefetch
            aria-label="Menuly · Panel"
            className="inline-flex items-center"
          >
            <BrandLogo priority className="w-[124px] md:w-[142px]" />
          </Link>
          <div className="flex items-center gap-2 md:mt-5">
            <RestaurantSwitcher activeId={restaurant.id} items={items} />
            <span className="md:hidden"><SignOut compact /></span>
          </div>
        </div>
        <DashboardNavigation links={navigation} />
        <div className="mt-8 hidden border-t border-stone-200 pt-4 md:mt-auto md:block">
          <SignOut />
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
