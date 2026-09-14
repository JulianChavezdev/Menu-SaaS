import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdirSync, writeFileSync } from "node:fs";
import type { ReactNode } from "react";

const state = vi.hoisted(() => ({
  path: "/dashboard",
  empty: false,
  error: false,
  ordering: false,
}));
vi.mock("next/navigation", () => ({
  usePathname: () => state.path,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  redirect: () => {
    throw new Error("redirect");
  },
}));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
    prefetch?: boolean;
  }) => {
    const { prefetch: _, ...rest } = props;
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
}));
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className: string;
  }) => <img src={src} alt={alt} className={className} />,
}));
vi.mock("@/lib/superadmin", () => ({ isSuperadminUser: () => false }));
vi.mock("@/app/dashboard/actions", () => ({
  saveAnalyticsGoals: vi.fn(),
  selectRestaurant: vi.fn(),
}));
vi.mock("@/lib/permissions", () => ({
  activeRestaurant: async () => {
    const restaurant = {
      id: "preview",
      name: "Bistro Nube",
      slug: "bistro-nube",
      subscription_status: "active",
      ordering_enabled: state.ordering,
      is_published: true,
      logo_url: "/brand/menuly-mark.png",
      phone: "123",
      address: "",
      currency: "EUR",
    };
    const names = [
      "Burrata con tomate",
      "Croquetas de jamón",
      "Tartar de atún",
      "Hamburguesa de la casa",
      "Tarta de queso",
    ];
    const rows = state.empty
      ? []
      : Array.from({ length: 180 }, (_, index) => {
          const date = new Date();
          date.setUTCDate(date.getUTCDate() - 179 + index);
          const event_date = date.toISOString().slice(0, 10);
          return [
            {
              event_date,
              event_type: "menu_view",
              event_count: 18 + ((index * 7) % 41),
            },
            ...names.flatMap((name, p) =>
              [
                "product_view",
                "cart_add",
                "detail_open",
                "video_play",
                "recommendation_add",
              ].map((event_type) => ({
                event_date,
                event_type,
                event_count:
                  event_type === "product_view"
                    ? 8 + ((index + p * 3) % 15)
                    : event_type === "cart_add"
                      ? 1 + ((index + p) % 5)
                      : event_type === "recommendation_add"
                        ? 0
                        : 2 + ((index + p) % 7),
                product_id: `p${p}`,
                products: {
                  name,
                  category_id: p < 2 ? "c1" : "c2",
                  categories: { name: p < 2 ? "Entrantes" : "Nuestra carta" },
                },
              })),
            ),
          ];
        }).flat();
    return {
      restaurant,
      member: { role: "owner" },
      user: { id: "preview-user" },
      supabase: {
        from: (table: string) => {
          let minimum = "",
            maximum = "9999";
          let mediaCount=24;
          const query = {
            select: () => query,
            eq: () => query,
            not: () => {mediaCount=16;return query;},
            or: () => {mediaCount=20;return query;},
            is: () => {mediaCount=4;return query;},
            gte: (_key: string, value: string) => {
              minimum = value;
              return query;
            },
            lte: (_key: string, value: string) => {
              maximum = value;
              return query;
            },
            order: () => query,
            maybeSingle: () => query,
            then: (resolve: (value: unknown) => unknown) =>
              resolve({
                data:
                  table === "menu_analytics_daily"
                    ? rows.filter(
                        (row) =>
                          row.event_date >= minimum &&
                          row.event_date <= maximum,
                      )
                    : table === "subscriptions"
                      ? { status: "active", plan: "carta" }
                      : table === "restaurant_analytics_goals"
                        ? { weekly_menu_views: 300, weekly_cart_adds: 50 }
                        : table === "restaurant_members"
                          ? [{ restaurants: restaurant }]
                          : [],
                count: state.empty ? 0 : table === "categories" ? 5 : mediaCount,
                error:
                  state.error && table === "menu_analytics_daily"
                    ? { message: "Analytics unavailable" }
                    : null,
              }),
          };
          return query;
        },
      },
    };
  },
}));
vi.mock("@/components/dashboard/daily-visits-chart", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("../src/components/dashboard/daily-visits-chart")
    >();
  return {
    DailyVisitsChart: (
      props: Parameters<typeof original.DailyVisitsChart>[0],
    ) => (
      <div id="preview-chart" data-props={JSON.stringify(props)}>
        <original.DailyVisitsChart {...props} />
      </div>
    ),
  };
});
vi.mock("@/components/dashboard/analytics-products", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("../src/components/dashboard/analytics-products")
    >();
  return {
    AnalyticsProducts: (
      props: Parameters<typeof original.AnalyticsProducts>[0],
    ) => (
      <div id="preview-products" data-props={JSON.stringify(props)}>
        <original.AnalyticsProducts {...props} />
      </div>
    ),
  };
});

import Dashboard from "../src/app/dashboard/page";
import AnalyticsPage from "../src/app/dashboard/analytics/page";
import Layout from "../src/app/dashboard/layout";

async function render(page: ReactNode, file?: string) {
  const html = renderToStaticMarkup(await Layout({ children: page }));
  if (file && process.env.MENULY_WRITE_PREVIEWS === "true") {
    mkdirSync("tmp", { recursive: true });
    writeFileSync(
      `tmp/${file}.html`,
      `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/tmp/preview.css"><title>Menuly · Revisión local</title></head><body>${html}<script type="module" src="/tmp/preview-client.js"></script></body></html>`,
    );
  }
  return html;
}
describe("restaurant workspace rendering", () => {
  beforeEach(() => {
    state.path = "/dashboard";
    state.empty = false;
    state.error = false;
    state.ordering = false;
  });
  it("renders the overview and marks its current navigation section", async () => {
    const html = await render(await Dashboard(), "review-home");
    expect(html).toContain("Resumen</h1>");
    expect(html).toMatch(/href="\/dashboard"[^>]*aria-current="page"/);
    expect(html).toContain("Editar la carta");
    expect(html).not.toContain("Abrir cocina");
  });
  it.each(["7", "30", "90"])(
    "renders the %s-day report with the matching export",
    async (days) => {
      state.path = "/dashboard/analytics";
      const html = await render(
        await AnalyticsPage({ searchParams: Promise.resolve({ days }) }),
        `review-analytics-${days}`,
      );
      expect(html).toContain(`/api/dashboard/analytics/export?days=${days}`);
      expect(html).toContain("Burrata con tomate");
      expect(html).toContain("Buscar producto o categoría");
      expect(html).toContain("no confirma una venta");
      expect(html).not.toContain("Categorías que más venden");
      expect(html).toContain(`max="${Number(days) - 1}"`);
    },
  );
  it("renders a truthful empty report without a best day or invalid numbers", async () => {
    state.empty = true;
    state.path = "/dashboard/analytics";
    const html = await render(
      await AnalyticsPage({ searchParams: Promise.resolve({ days: "30" }) }),
      "review-empty",
    );
    expect(html).toContain("Todavía no hay visitas registradas.");
    expect(html).not.toContain("Mejor día");
    expect(html).not.toMatch(/NaN|Infinity/);
  });
  it("does not turn a database failure into zero-valued metrics", async () => {
    state.error = true;
    await expect(
      AnalyticsPage({ searchParams: Promise.resolve({ days: "30" }) }),
    ).rejects.toThrow("Analytics unavailable");
  });
  it("retains operational shortcuts for restaurants with ordering", async () => {
    state.ordering = true;
    const html = await render(await Dashboard());
    expect(html).toContain("Abrir cocina");
    expect(html).toContain("Abrir comandero");
  });
});
