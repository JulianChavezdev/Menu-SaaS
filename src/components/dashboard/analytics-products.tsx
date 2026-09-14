"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import type { summarizeAnalytics } from "@/lib/analytics";
type Product = ReturnType<typeof summarizeAnalytics>["products"][number];
const normalized = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const number = (value: number) => value.toLocaleString("es-ES");

export function AnalyticsProducts({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("views");
  const items = useMemo(
    () =>
      products
        .filter((item) =>
          normalized(`${item.name} ${item.categoryName}`).includes(
            normalized(query.trim()),
          ),
        )
        .sort((a, b) =>
          sort === "adds"
            ? b.cartAdds - a.cartAdds || b.views - a.views
            : sort === "rate"
              ? b.addRate - a.addRate || b.views - a.views
              : b.views - a.views || b.cartAdds - a.cartAdds,
        ),
    [products, query, sort],
  );
  return (
    <section className="workspace-panel mt-6">
      <div className="workspace-section-header flex-wrap">
        <div>
          <h2>Rendimiento de productos</h2>
          <p>Visualizaciones, detalles y añadidos al carrito.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="relative">
            <span className="sr-only">Buscar producto o categoría</span>
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-3 text-slate-400"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar producto…"
              className="h-9 w-44 py-2 pl-9 pr-3 text-xs"
            />
          </label>
          <label className="relative">
            <span className="sr-only">Ordenar productos</span>
            <ArrowUpDown
              size={13}
              className="pointer-events-none absolute left-3 top-3 text-slate-400"
            />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="h-9 py-2 pl-8 pr-3 text-xs"
            >
              <option value="views">Más vistos</option>
              <option value="adds">Más añadidos</option>
              <option value="rate">Mayor tasa</option>
            </select>
          </label>
        </div>
      </div>
      <p className="sr-only" role="status">
        {items.length} productos
      </p>
      <div className="divide-y divide-stone-100 lg:hidden">
        {items.map((item) => (
          <article key={item.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm">{item.name}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {item.categoryName}
                </p>
              </div>
              <Rate value={item.addRate} />
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3">
              {[
                ["Vistas", item.views],
                ["Detalles", item.detailOpens],
                ["Añadidos", item.cartAdds],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10px] text-slate-500">{label}</dt>
                  <dd className="mt-1 text-sm font-medium tabular-nums">
                    {number(Number(value))}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto lg:block">
        <table className="workspace-table">
          <caption className="sr-only">
            Rendimiento de productos, ordenados por{" "}
            {sort === "adds"
              ? "añadidos"
              : sort === "rate"
                ? "tasa de añadido"
                : "visualizaciones"}
          </caption>
          <thead>
            <tr>
              {[
                "Producto",
                "Vistas",
                "Vídeos",
                "Detalles",
                "Añadidos",
                "Tasa",
              ].map((label) => (
                <th key={label} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.name}</strong>
                  <p>{item.categoryName}</p>
                </td>
                <td>{number(item.views)}</td>
                <td>{number(item.videoPlays)}</td>
                <td>{number(item.detailOpens)}</td>
                <td>
                  {number(item.cartAdds)}
                  {item.recommendationAdds > 0 && (
                    <p>{number(item.recommendationAdds)} por recomendación</p>
                  )}
                </td>
                <td>
                  <Rate value={item.addRate} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!items.length && (
        <div className="p-10 text-center">
          <p className="text-sm text-slate-600">
            {query
              ? "No hay productos que coincidan con la búsqueda."
              : "Todavía no hay actividad de productos."}
          </p>
          {query && (
            <button
              onClick={() => setQuery("")}
              className="workspace-text-link mt-3"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      )}
      <div className="border-t border-stone-200 px-5 py-3 text-[11px] leading-5 text-slate-500">
        Tasa: añadidos por cada 100 visualizaciones. Son acciones, no
        compradores únicos.
      </div>
    </section>
  );
}
function Rate({ value }: { value: number }) {
  return (
    <div className="text-right">
      <span className="workspace-rate">{value}%</span>
      <div aria-hidden="true" className="workspace-rate-track">
        <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}
