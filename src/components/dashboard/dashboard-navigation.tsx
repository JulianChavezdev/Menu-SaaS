"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  ChefHat,
  ClipboardList,
  CreditCard,
  Home,
  Palette,
  QrCode,
  Settings,
  ShieldCheck,
  Store,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  "/dashboard": Home,
  "/dashboard/menu": BookOpen,
  "/dashboard/analytics": BarChart3,
  "/dashboard/appearance": Palette,
  "/dashboard/qr": QrCode,
  "/dashboard/restaurant": Store,
  "/dashboard/members": Users,
  "/dashboard/billing": CreditCard,
  "/dashboard/tables": UtensilsCrossed,
  "/dashboard/orders": ClipboardList,
  "/operaciones/comandero": ClipboardList,
  "/operaciones/cocina": ChefHat,
  "/superadmin": ShieldCheck,
};
const groupFor = (href: string) =>
  href.startsWith("/operaciones/") ||
  ["/dashboard/tables", "/dashboard/orders"].includes(href)
    ? "Servicio"
    : [
          "/dashboard/restaurant",
          "/dashboard/members",
          "/dashboard/billing",
          "/superadmin",
        ].includes(href)
      ? "Administración"
      : "Tu restaurante";

export function DashboardNavigation({
  links,
}: {
  links: readonly (readonly [string, string])[];
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones del panel" className="workspace-navigation">
      {["Tu restaurante", "Servicio", "Administración"].map((group) => {
        const items = links.filter(([, href]) => groupFor(href) === group);
        if (!items.length) return null;
        return (
          <div key={group} className="workspace-nav-group">
            <p>{group}</p>
            {items.map(([label, href]) => {
              const active =
                href === "/dashboard"
                  ? pathname === href
                  : pathname.startsWith(href);
              const Icon = icons[href] ?? Settings;
              const content = (
                <>
                  <Icon size={17} strokeWidth={1.7} />
                  <span>{label}</span>
                </>
              );
              return href.startsWith("/operaciones/") ? (
                <a
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                >
                  {content}
                </a>
              ) : (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  prefetch
                >
                  {content}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
