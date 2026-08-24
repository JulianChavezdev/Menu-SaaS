"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  Check,
  ChefHat,
  ChevronLeft,
  Minus,
  Plus,
  Search,
  Send,
  ShoppingCart,
  Table2,
  Utensils,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  createStaffDiningOrder,
  type StaffOrderInput,
} from "@/app/dashboard/ordering/pos-actions";

type Table = {
  id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
};
type Category = { id: string; name: string; sort_order: number };
type Product = {
  id: string;
  category_id: string;
  name: string;
  price_cents: number;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
};
type Line = { productId: string; quantity: number; note: string };

export function WaiterPos({
  restaurantName,
  currency,
  tables,
  categories,
  products,
  initialTableId,
}: {
  restaurantName: string;
  currency: string;
  tables: Table[];
  categories: Category[];
  products: Product[];
  initialTableId?: string;
}) {
  const validInitial = tables.some((table) => table.id === initialTableId)
    ? initialTableId
    : undefined;
  const [tableId, setTableId] = useState<string | undefined>(validInitial);
  const [categoryId, setCategoryId] = useState("");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Line[]>([]);
  const [generalNote, setGeneralNote] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<{
    number: string;
    tableName: string;
  } | null>(null);
  const requestId = useRef<string | null>(null);
  const [sending, startTransition] = useTransition();

  const table = tables.find((item) => item.id === tableId);
  const formatter = useMemo(
    () => new Intl.NumberFormat("es-ES", { style: "currency", currency }),
    [currency],
  );
  const quantityByProduct = useMemo(
    () => new Map(cart.map((line) => [line.productId, line.quantity])),
    [cart],
  );
  const categoryCovers = useMemo(
    () =>
      new Map(
        categories.map((category) => [
          category.id,
          products.find(
            (product) =>
              product.category_id === category.id && product.image_url,
          )?.image_url ?? null,
        ]),
      ),
    [categories, products],
  );
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const visibleProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          (normalizedQuery || product.category_id === categoryId) &&
          (!normalizedQuery ||
            product.name.toLocaleLowerCase("es").includes(normalizedQuery)),
      ),
    [categoryId, normalizedQuery, products],
  );
  const cartDetails = cart.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId);
    return product ? [{ ...line, product }] : [];
  });
  const units = cart.reduce((sum, line) => sum + line.quantity, 0);
  const total = cartDetails.reduce(
    (sum, line) => sum + line.product.price_cents * line.quantity,
    0,
  );
  const selectedCategory = categories.find((item) => item.id === categoryId);
  const showingProducts = Boolean(categoryId || normalizedQuery);

  function add(productId: string) {
    setCart((current) => {
      const existing = current.find((line) => line.productId === productId);
      return existing
        ? current.map((line) =>
            line.productId === productId
              ? { ...line, quantity: Math.min(20, line.quantity + 1) }
              : line,
          )
        : [...current, { productId, quantity: 1, note: "" }];
    });
  }

  function change(productId: string, amount: number) {
    setCart((current) =>
      current.flatMap((line) => {
        if (line.productId !== productId) return [line];
        const quantity = line.quantity + amount;
        return quantity > 0 ? [{ ...line, quantity }] : [];
      }),
    );
  }

  function selectTable(nextTableId: string) {
    if (cart.length && tableId && nextTableId !== tableId) {
      if (!confirm("¿Cambiar de mesa? La comanda actual se conservará."))
        return;
    }
    setTableId(nextTableId);
    setLastOrder(null);
  }

  function submit() {
    if (!tableId || !cart.length || sending) return;
    requestId.current ??= crypto.randomUUID();
    const payload: StaffOrderInput = {
      tableId,
      requestId: requestId.current,
      note: generalNote,
      lines: cart,
    };
    startTransition(async () => {
      try {
        const order = await createStaffDiningOrder(payload);
        setLastOrder({ number: order.number, tableName: order.tableName });
        setCart([]);
        setGeneralNote("");
        setCartOpen(false);
        requestId.current = null;
        toast.success(`Comanda #${order.number} enviada a Cocina`);
      } catch (reason) {
        toast.error(
          reason instanceof Error
            ? reason.message
            : "No se pudo enviar la comanda.",
        );
      }
    });
  }

  return (
    <section className="min-h-[100dvh] bg-[#eef1f5] pb-28 text-slate-950 md:min-h-screen md:pb-10">
      <header className="sticky top-0 z-40 border-b-4 border-orange-500 bg-slate-950 px-3 pb-3 pt-[max(.75rem,env(safe-area-inset-top))] text-white shadow-md md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard"
              aria-label="Volver al panel"
              className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/10 active:scale-95"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase tracking-[.15em] text-orange-300">
                {restaurantName}
              </p>
              <h1 className="text-lg font-black uppercase tracking-tight !text-white">
                Comandero
              </h1>
            </div>
          </div>
          <nav className="flex items-center gap-1" aria-label="Operaciones">
            <Link
              href="/dashboard/tables"
              className="grid size-10 place-items-center rounded-lg text-slate-300 active:bg-white/10"
              aria-label="Organizar mesas"
            >
              <Table2 size={20} />
            </Link>
            <Link
              href="/dashboard/kitchen"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-orange-500 px-3 text-xs font-black text-slate-950 active:scale-95"
            >
              <ChefHat size={18} />
              Cocina
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-3 md:p-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.15em] text-slate-400">
                Mesa de la comanda
              </p>
              <h2 className="text-sm font-extrabold">
                {table ? `${table.name} seleccionada` : "Selecciona una mesa"}
              </h2>
            </div>
            {table && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-800">
                Lista
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-10">
            {tables.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTable(item.id)}
                className={`min-h-12 rounded-xl border px-2 text-sm font-black transition active:scale-95 ${item.id === tableId ? "border-orange-500 bg-orange-500 text-slate-950 shadow-sm" : "border-slate-200 bg-slate-50 text-slate-700"}`}
              >
                {item.name}
              </button>
            ))}
          </div>
          {!tables.length && (
            <p className="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">
              Primero crea las mesas desde Organización de mesas.
            </p>
          )}
        </section>

        {lastOrder && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-emerald-900">
            <Check size={20} />
            <p className="text-sm font-bold">
              Comanda #{lastOrder.number} enviada para {lastOrder.tableName}.
            </p>
          </div>
        )}

        <label
          className={`mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm ${table ? "" : "pointer-events-none opacity-50"}`}
        >
          <Search size={18} className="text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar producto o bebida"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Borrar búsqueda"
            >
              <X size={17} />
            </button>
          )}
        </label>

        {!table ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Table2 className="mx-auto text-orange-500" size={34} />
            <h2 className="mt-3 font-extrabold">Elige una mesa para empezar</h2>
            <p className="mt-1 text-sm text-slate-500">
              Después podrás entrar en una categoría y añadir platos.
            </p>
          </div>
        ) : !showingProducts ? (
          <section className="mt-4">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.15em] text-orange-700">
                  Carta
                </p>
                <h2 className="text-xl font-black">Categorías</h2>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {categories.length} disponibles
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
              {categories.map((category) => {
                const cover = categoryCovers.get(category.id);
                const count = products.filter(
                  (product) => product.category_id === category.id,
                ).length;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategoryId(category.id)}
                    className="group relative aspect-[1.55/1] overflow-hidden rounded-2xl bg-slate-800 text-left shadow-sm active:scale-[.98]"
                  >
                    {cover ? (
                      <span
                        role="img"
                        aria-label={category.name}
                        className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-105"
                        style={{ backgroundImage: `url(${cover})` }}
                      />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center text-slate-500">
                        <Utensils size={36} />
                      </span>
                    )}
                    <span className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 p-4 text-white">
                      <strong className="block text-lg leading-tight">
                        {category.name}
                      </strong>
                      <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-slate-300">
                        {count} producto{count === 1 ? "" : "s"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="mt-4">
            <div className="mb-3 flex items-center gap-3">
              {!normalizedQuery && (
                <button
                  type="button"
                  onClick={() => setCategoryId("")}
                  className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white shadow-sm active:scale-95"
                  aria-label="Volver a categorías"
                >
                  <ChevronLeft size={21} />
                </button>
              )}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.15em] text-orange-700">
                  {table.name}
                </p>
                <h2 className="text-xl font-black">
                  {normalizedQuery ? "Resultados" : selectedCategory?.name}
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {visibleProducts.map((product) => {
                const quantity = quantityByProduct.get(product.id) ?? 0;
                return (
                  <article
                    key={product.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => add(product.id)}
                      className="relative block aspect-[4/3] w-full overflow-hidden bg-slate-100 text-left active:opacity-80"
                    >
                      {product.image_url ? (
                        <span
                          role="img"
                          aria-label={product.name}
                          className="block h-full w-full bg-cover bg-center"
                          style={{
                            backgroundImage: `url(${product.image_url})`,
                          }}
                        />
                      ) : (
                        <span className="grid h-full place-items-center text-slate-400">
                          <Utensils size={30} />
                        </span>
                      )}
                      {quantity > 0 && (
                        <span className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-orange-500 text-sm font-black text-slate-950 shadow-lg">
                          {quantity}
                        </span>
                      )}
                    </button>
                    <div className="p-3">
                      <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5">
                        {product.name}
                      </h3>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <strong>
                          {formatter.format(product.price_cents / 100)}
                        </strong>
                        <button
                          type="button"
                          onClick={() => add(product.id)}
                          aria-label={`Añadir ${product.name}`}
                          className="grid size-10 place-items-center rounded-xl bg-slate-950 text-white active:scale-95"
                        >
                          <Plus size={19} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
              {!visibleProducts.length && (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                  No hay productos disponibles.
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {units > 0 && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed bottom-[max(.75rem,env(safe-area-inset-bottom))] left-1/2 z-[75] flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-2xl bg-slate-950 px-5 py-4 text-white shadow-2xl md:left-auto md:right-6 md:translate-x-0"
        >
          <span className="flex items-center gap-2">
            <ShoppingCart size={20} />
            <strong>
              {units} artículo{units === 1 ? "" : "s"}
            </strong>
          </span>
          <strong>{formatter.format(total / 100)}</strong>
        </button>
      )}

      {cartOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end bg-slate-950/60 backdrop-blur-sm"
          onClick={() => setCartOpen(false)}
        >
          <aside
            aria-label="Comanda actual"
            className="mx-auto flex max-h-[94dvh] w-full max-w-xl flex-col rounded-t-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-orange-700">
                  {table?.name}
                </p>
                <h2 className="text-2xl font-black">Comanda actual</h2>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="grid size-10 place-items-center rounded-xl bg-slate-100"
                aria-label="Cerrar comanda"
              >
                <X size={20} />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              {cartDetails.map(({ product, productId, quantity, note }) => (
                <article
                  key={productId}
                  className="border-b border-slate-200 pb-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold">{product.name}</h3>
                      <p className="mt-0.5 text-sm font-semibold text-orange-700">
                        {formatter.format(
                          (product.price_cents * quantity) / 100,
                        )}
                      </p>
                    </div>
                    <div className="flex items-center rounded-xl border border-slate-300">
                      <button
                        type="button"
                        onClick={() => change(productId, -1)}
                        className="grid size-10 place-items-center"
                        aria-label={`Quitar ${product.name}`}
                      >
                        <Minus size={15} />
                      </button>
                      <strong className="w-8 text-center">{quantity}</strong>
                      <button
                        type="button"
                        onClick={() => change(productId, 1)}
                        className="grid size-10 place-items-center"
                        aria-label={`Añadir otra unidad de ${product.name}`}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>
                  <input
                    value={note}
                    onChange={(event) =>
                      setCart((current) =>
                        current.map((line) =>
                          line.productId === productId
                            ? {
                                ...line,
                                note: event.target.value.slice(0, 300),
                              }
                            : line,
                        ),
                      )
                    }
                    maxLength={300}
                    placeholder="Cambios: sin cebolla, punto de carne…"
                    className="mt-3 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-orange-500"
                  />
                </article>
              ))}
              <label className="block text-sm font-bold">
                Observación general
                <textarea
                  value={generalNote}
                  onChange={(event) =>
                    setGeneralNote(event.target.value.slice(0, 300))
                  }
                  maxLength={300}
                  placeholder="Ej. Sacar entrantes primero"
                  className="mt-2 min-h-20 w-full resize-none rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm font-normal outline-none focus:border-orange-500"
                />
              </label>
            </div>
            <div className="border-t border-slate-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="mb-3 flex items-center justify-between text-lg">
                <span>Total</span>
                <strong>{formatter.format(total / 100)}</strong>
              </div>
              <button
                type="button"
                disabled={sending || !cart.length}
                onClick={submit}
                className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-black text-slate-950 disabled:opacity-50"
              >
                <Send size={19} />
                {sending ? "Enviando…" : "Enviar a Cocina"}
              </button>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
