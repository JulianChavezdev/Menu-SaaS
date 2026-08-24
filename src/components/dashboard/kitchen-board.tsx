"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  BellRing,
  Check,
  Clock3,
  MessageSquareText,
  MonitorCheck,
  RefreshCw,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { transitionDiningOrder } from "@/app/dashboard/ordering/actions";
import { SignOut } from "@/components/dashboard/sign-out";
import type { OrderStatus } from "@/lib/table-ordering";
import type { KitchenOrder } from "@/lib/kitchen-orders";

export type { KitchenOrder } from "@/lib/kitchen-orders";

const columns = [
  {
    key: "new",
    statuses: ["pending", "accepted", "preparing"] as OrderStatus[],
    title: "Nuevos",
    tone: "border-orange-400",
  },
  {
    key: "ready",
    statuses: ["ready"] as OrderStatus[],
    title: "Listos",
    tone: "border-emerald-500",
  },
];
type ColumnKey = (typeof columns)[number]["key"];

type WakeLockHandle = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: "release", listener: () => void) => void;
};
type WakeNavigator = Navigator & {
  wakeLock?: { request: (type: "screen") => Promise<WakeLockHandle> };
};

export function KitchenBoard({
  restaurantId,
  currency,
  initialOrders,
  isManager,
}: {
  restaurantId: string;
  currency: string;
  initialOrders: KitchenOrder[];
  isManager: boolean;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [activeColumn, setActiveColumn] = useState<ColumnKey>("new");
  const [lastSync, setLastSync] = useState(() => new Date());
  const [operationsEnabled, setOperationsEnabled] = useState(false);
  const [screenAwake, setScreenAwake] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const wakeLock = useRef<WakeLockHandle | null>(null);
  const refreshing = useRef(false);
  const knownOrders = useRef(new Set(initialOrders.map((order) => order.id)));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  useEffect(() => {
    setOrders(initialOrders);
    knownOrders.current = new Set(initialOrders.map((order) => order.id));
  }, [initialOrders]);

  const soundAlert = useCallback(() => {
    const context = audio.current;
    if (!context) return;
    void context.resume().then(() => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.12, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.35);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.35);
    });
  }, []);

  const refreshOrders = useCallback(
    async (reportError = false) => {
      if (refreshing.current) return;
      refreshing.current = true;
      try {
        const response = await fetch("/api/dashboard/kitchen/orders", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        const payload = (await response.json()) as {
          orders?: KitchenOrder[];
          error?: string;
        };
        if (!response.ok || !payload.orders)
          throw new Error(
            payload.error ?? "No se pudieron actualizar pedidos.",
          );

        const hasNewOrder = payload.orders.some(
          (order) =>
            order.status === "pending" && !knownOrders.current.has(order.id),
        );
        knownOrders.current = new Set(payload.orders.map((order) => order.id));
        setOrders(payload.orders);
        setLastSync(new Date());
        if (hasNewOrder) soundAlert();
        if (reportError) setError("");
      } catch (reason) {
        if (reportError)
          setError(
            reason instanceof Error
              ? reason.message
              : "No se pudieron actualizar los pedidos.",
          );
      } finally {
        refreshing.current = false;
      }
    },
    [soundAlert],
  );

  const requestWakeLock = useCallback(async () => {
    const api = (navigator as WakeNavigator).wakeLock;
    if (!api || document.visibilityState !== "visible") return;
    try {
      wakeLock.current = await api.request("screen");
      setScreenAwake(true);
      wakeLock.current.addEventListener("release", () => setScreenAwake(false));
    } catch {
      setScreenAwake(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let refreshTimer: number | undefined;
    const delayedRefresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => void refreshOrders(), 40);
    };
    const channel = supabase
      .channel(`kitchen:${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dining_orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        delayedRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dining_order_items",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        delayedRefresh,
      )
      .subscribe();
    const polling = window.setInterval(() => void refreshOrders(), 1000);
    const refreshVisible = () => {
      if (document.visibilityState === "visible") void refreshOrders();
    };
    window.addEventListener("focus", refreshVisible);
    document.addEventListener("visibilitychange", refreshVisible);
    void refreshOrders();
    return () => {
      window.clearInterval(polling);
      window.clearTimeout(refreshTimer);
      window.removeEventListener("focus", refreshVisible);
      document.removeEventListener("visibilitychange", refreshVisible);
      void supabase.removeChannel(channel);
    };
  }, [refreshOrders, restaurantId]);

  useEffect(() => {
    const resume = () => {
      if (
        document.visibilityState === "visible" &&
        operationsEnabled &&
        (!wakeLock.current || wakeLock.current.released)
      )
        void requestWakeLock();
    };
    document.addEventListener("visibilitychange", resume);
    return () => {
      document.removeEventListener("visibilitychange", resume);
      void wakeLock.current?.release();
    };
  }, [operationsEnabled, requestWakeLock]);

  async function enableOperations() {
    const Context = window.AudioContext ?? window.webkitAudioContext;
    audio.current ??= new Context();
    await audio.current.resume();
    setOperationsEnabled(true);
    soundAlert();
    await requestWakeLock();
  }

  function move(id: string, status: OrderStatus) {
    setError("");
    const previous = orders;
    setOrders((current) =>
      current.flatMap((order) =>
        order.id !== id
          ? [order]
          : ["delivered", "rejected", "cancelled"].includes(status)
            ? []
            : [{ ...order, status }],
      ),
    );
    startTransition(async () => {
      try {
        await transitionDiningOrder(id, status);
        await refreshOrders(true);
      } catch (reason) {
        setOrders(previous);
        setError(
          reason instanceof Error
            ? reason.message
            : "No se pudo actualizar el pedido.",
        );
      }
    });
  }

  return (
    <section className="min-h-[100dvh] bg-[#f4f1eb] text-slate-950">
      <header className="sticky top-0 z-40 border-b-4 border-orange-600 bg-white px-3 pb-3 pt-[max(.75rem,env(safe-area-inset-top))] text-slate-950 shadow-sm md:px-6">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {isManager && <Link
              href="/dashboard"
              aria-label="Volver al panel"
              className="grid size-10 shrink-0 place-items-center rounded-lg bg-stone-100 active:scale-95"
            >
              <ArrowLeft size={20} />
            </Link>}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.15em] text-orange-700">
                Menuly Comandas
              </p>
              <h1 className="text-lg font-black uppercase tracking-tight text-slate-950">
                Cocina
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => void refreshOrders(true)}
              className="grid size-10 place-items-center rounded-lg bg-stone-100 text-slate-700 active:scale-95"
              aria-label="Actualizar comandas"
            >
              <RefreshCw
                size={18}
                className={isPending ? "animate-spin" : ""}
              />
            </button>
            {isManager && <Link
              href="/operaciones/comandero"
              className="inline-flex min-h-10 items-center rounded-lg bg-stone-100 px-3 text-xs font-black"
            >
              Comandero
            </Link>}
            <button
              type="button"
              onClick={() => void enableOperations()}
              className={`grid size-10 place-items-center rounded-lg ${operationsEnabled ? "bg-emerald-600 text-white" : "bg-orange-600 text-white"}`}
              aria-label={
                operationsEnabled ? "Modo cocina activo" : "Activar modo cocina"
              }
            >
              {screenAwake ? (
                <MonitorCheck size={19} />
              ) : (
                <BellRing size={19} />
              )}
            </button>
            {!isManager && <SignOut compact />}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] p-3 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">Servicio en curso</h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              Sincronizado a las{" "}
              {lastSync.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black shadow-sm">
            {orders.length} activas
          </span>
        </div>

        <nav
          aria-label="Estados de cocina"
          className="mt-4 grid grid-cols-2 gap-2 lg:hidden"
        >
          {columns.map((column) => {
            const count = orders.filter((order) =>
              column.statuses.includes(order.status),
            ).length;
            return (
              <button
                key={column.key}
                type="button"
                onClick={() => setActiveColumn(column.key)}
                className={`rounded-xl border px-2 py-3 text-xs font-black ${activeColumn === column.key ? "border-orange-600 bg-orange-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}
              >
                <span className="block text-lg">{count}</span>
                {column.title}
              </button>
            );
          })}
        </nav>

        {operationsEnabled && !screenAwake && (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
            Este dispositivo no permite mantener la pantalla encendida.
            Desactiva el bloqueo automático mientras uses Cocina.
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-700"
          >
            {error}
          </p>
        )}

        <div className="mt-4 grid min-h-[60vh] gap-4 lg:grid-cols-2">
          {columns.map((column) => {
            const visible = orders.filter((order) =>
              column.statuses.includes(order.status),
            );
            return (
              <section
                key={column.key}
                className={`${activeColumn === column.key ? "block" : "hidden"} rounded-2xl border-t-4 ${column.tone} bg-slate-100 p-3 lg:block`}
              >
                <div className="mb-3 hidden items-center justify-between lg:flex">
                  <h3 className="font-extrabold">{column.title}</h3>
                  <span className="grid h-7 min-w-7 place-items-center rounded-lg bg-white px-2 text-xs font-black shadow-sm">
                    {visible.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {visible.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      currency={currency}
                      disabled={isPending}
                      move={move}
                    />
                  ))}
                  {!visible.length && (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-semibold text-slate-400">
                      Sin comandas
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function OrderCard({
  order,
  currency,
  disabled,
  move,
}: {
  order: KitchenOrder;
  currency: string;
  disabled: boolean;
  move: (id: string, status: OrderStatus) => void;
}) {
  const age = Math.max(
    0,
    Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60_000),
  );
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div
        className={`h-1.5 ${order.status === "pending" ? "bg-orange-500" : order.status === "ready" ? "bg-emerald-500" : "bg-amber-400"}`}
      />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-orange-700">
              Comanda #{order.number}
            </p>
            <h3 className="mt-1 text-xl font-black">{order.tableName}</h3>
          </div>
          <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
            <Clock3 size={14} />
            {age} min
          </span>
        </div>
        {order.customerNote && (
          <div className="mt-3 border-l-4 border-amber-500 bg-amber-50 p-3 text-amber-950">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide">
              <MessageSquareText size={14} />
              Observación general de la mesa
            </p>
            <p className="mt-1 text-sm font-bold">{order.customerNote}</p>
          </div>
        )}
        <ul className="mt-4 space-y-3 rounded-xl bg-slate-50 p-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-2">
              <strong className="w-6 shrink-0 text-orange-700">
                {item.quantity}×
              </strong>
              <div className="min-w-0">
                <p className="font-bold">{item.name}</p>
                {item.note && (
                  <p className="mt-1 border-l-2 border-amber-500 pl-2 text-xs font-bold text-amber-900">
                    Modificación solicitada: {item.note}
                  </p>
                )}
              </div>
            </li>
          ))}
          {!order.items.length && (
            <li className="text-sm font-bold text-red-700">
              Detalle no disponible. La pantalla volverá a sincronizarlo
              automáticamente.
            </li>
          )}
        </ul>
        <p className="mt-3 text-right text-sm font-black">
          {new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency,
          }).format(order.subtotalCents / 100)}
        </p>
        <div className="mt-4 grid gap-2">
          {["pending", "accepted", "preparing"].includes(order.status) && (
            <>
              <button
                disabled={disabled}
                onClick={() => move(order.id, "ready")}
                className="inline-flex min-h-11 items-center justify-center gap-2 bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                <Check size={17} />
                Marcar como listo
              </button>
            </>
          )}
          {["pending", "accepted", "preparing"].includes(order.status) && (
            <button
              disabled={disabled}
              onClick={() => {
                if (confirm("¿Cancelar esta comanda?"))
                  move(order.id, "cancelled");
              }}
              className="inline-flex items-center justify-center gap-2 border border-red-300 px-4 py-2 text-xs font-bold text-red-700"
            >
              <X size={15} />
              Cancelar comanda
            </button>
          )}
          {order.status === "ready" && (
            <button
              disabled={disabled}
              onClick={() => move(order.id, "delivered")}
              className="min-h-11 bg-orange-600 px-4 py-2 text-sm font-bold text-white"
            >
              Entregado
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}
