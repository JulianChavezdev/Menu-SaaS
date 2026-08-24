"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  Check,
  ChevronRight,
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
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
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
  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return products.filter(
      (product) =>
        (normalized || !categoryId || product.category_id === categoryId) &&
        (!normalized ||
          product.name.toLocaleLowerCase("es").includes(normalized)),
    );
  }, [categoryId, products, query]);
  const cartDetails = cart.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId);
    return product ? [{ ...line, product }] : [];
  });
  const units = cart.reduce((sum, line) => sum + line.quantity, 0);
  const total = cartDetails.reduce(
    (sum, line) => sum + line.product.price_cents * line.quantity,
    0,
  );

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

  if (!table) {
    return (
      <section>
        <div className="border-b border-stone-200 pb-5">
          <p className="text-xs font-black uppercase tracking-[.16em] text-orange-700">
            Menuly Comandas
          </p>
          <h1 className="mt-1 text-3xl font-extrabold">¿En qué mesa?</h1>
          <p className="mt-2 text-sm text-slate-600">
            Selecciona una mesa para comenzar la comanda. No necesitas abrirla.
          </p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tables.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectTable(item.id)}
              className="group flex min-h-28 flex-col items-start justify-between border border-stone-200 bg-white p-4 text-left shadow-sm transition active:scale-[.98]"
            >
              <Table2 className="text-orange-600" size={24} />
              <span className="flex w-full items-end justify-between gap-2">
                <strong className="text-lg">{item.name}</strong>
                <ChevronRight
                  className="text-stone-400 group-hover:text-orange-600"
                  size={18}
                />
              </span>
            </button>
          ))}
          {!tables.length && (
            <div className="col-span-full border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-slate-500">
              Primero crea las mesas desde Organización de mesas.
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section>
      <header className="sticky top-0 z-30 -mx-3 border-b border-stone-200 bg-[#f4f1eb]/95 px-3 pb-3 backdrop-blur-md md:-mx-6 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setTableId(undefined)}
            className="flex min-w-0 items-center gap-2 text-left"
          >
            <span className="grid size-10 shrink-0 place-items-center bg-orange-600 text-white">
              <Table2 size={20} />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Mesa seleccionada
              </span>
              <strong className="block truncate text-lg">{table.name}</strong>
            </span>
          </button>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase text-slate-500">
              {restaurantName}
            </p>
            <p className="text-sm font-black">
              {units} artículo{units === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 border border-stone-300 bg-white px-3 py-2.5">
          <Search size={17} className="text-slate-400" />
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
              <X size={16} />
            </button>
          )}
        </label>
        <nav
          aria-label="Categorías"
          className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setCategoryId(category.id)}
              className={`shrink-0 border px-3 py-2 text-xs font-bold ${categoryId === category.id ? "border-orange-600 bg-orange-600 text-white" : "border-stone-300 bg-white text-slate-700"}`}
            >
              {category.name}
            </button>
          ))}
        </nav>
      </header>

      {lastOrder && (
        <div className="mt-4 flex items-center gap-3 border border-emerald-300 bg-emerald-50 p-3 text-emerald-900">
          <Check size={20} />
          <p className="text-sm font-bold">
            Comanda #{lastOrder.number} enviada para {lastOrder.tableName}.
          </p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visibleProducts.map((product) => {
          const quantity = quantityByProduct.get(product.id) ?? 0;
          return (
            <article
              key={product.id}
              className="overflow-hidden border border-stone-200 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => add(product.id)}
                className="relative block aspect-[4/3] w-full overflow-hidden bg-stone-100 text-left active:opacity-80"
              >
                {product.image_url ? (
                  <span
                    role="img"
                    aria-label={product.name}
                    className="block h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${product.image_url})` }}
                  />
                ) : (
                  <span className="grid h-full place-items-center text-stone-400">
                    <Utensils size={30} />
                  </span>
                )}
                {quantity > 0 && (
                  <span className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-orange-600 text-sm font-black text-white shadow-lg">
                    {quantity}
                  </span>
                )}
              </button>
              <div className="p-3">
                <h2 className="line-clamp-2 min-h-10 text-sm font-bold leading-5">
                  {product.name}
                </h2>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <strong className="text-orange-700">
                    {formatter.format(product.price_cents / 100)}
                  </strong>
                  <button
                    type="button"
                    onClick={() => add(product.id)}
                    aria-label={`Añadir ${product.name}`}
                    className="grid size-9 place-items-center bg-slate-900 text-white active:scale-95"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        {!visibleProducts.length && (
          <div className="col-span-full border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-slate-500">
            No hay productos en esta categoría.
          </div>
        )}
      </div>

      {units > 0 && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between bg-slate-950 px-5 py-4 text-white shadow-2xl md:left-auto md:right-6 md:translate-x-0"
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
          className="fixed inset-0 z-50 flex items-end bg-black/55 backdrop-blur-sm"
          onClick={() => setCartOpen(false)}
        >
          <aside
            aria-label="Comanda actual"
            className="mx-auto flex max-h-[94dvh] w-full max-w-xl flex-col bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
                  {table.name}
                </p>
                <h2 className="text-2xl font-extrabold">Comanda actual</h2>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="grid size-10 place-items-center bg-stone-100"
              >
                <X size={20} />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              {cartDetails.map(({ product, productId, quantity, note }) => (
                <article
                  key={productId}
                  className="border-b border-stone-200 pb-4"
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
                    <div className="flex items-center border border-stone-300">
                      <button
                        type="button"
                        onClick={() => change(productId, -1)}
                        className="grid size-9 place-items-center"
                      >
                        <Minus size={15} />
                      </button>
                      <strong className="w-8 text-center">{quantity}</strong>
                      <button
                        type="button"
                        onClick={() => change(productId, 1)}
                        className="grid size-9 place-items-center"
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
                    className="mt-3 w-full border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
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
                  className="mt-2 min-h-20 w-full resize-none border border-stone-300 bg-stone-50 p-3 text-sm font-normal outline-none focus:border-orange-500"
                />
              </label>
            </div>
            <div className="border-t border-stone-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="mb-3 flex items-center justify-between text-lg">
                <span>Total</span>
                <strong>{formatter.format(total / 100)}</strong>
              </div>
              <button
                type="button"
                disabled={sending || !cart.length}
                onClick={submit}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-orange-600 px-4 py-3 font-black text-white disabled:opacity-50"
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
