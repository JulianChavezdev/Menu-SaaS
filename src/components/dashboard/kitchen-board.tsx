"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  BellRing,
  Check,
  ChefHat,
  Clock3,
  MessageSquareText,
  MonitorCheck,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { transitionDiningOrder } from "@/app/dashboard/ordering/actions";
import type { OrderStatus } from "@/lib/table-ordering";
import type { KitchenOrder } from "@/lib/kitchen-orders";

export type { KitchenOrder } from "@/lib/kitchen-orders";

const columns: [OrderStatus[], string, string][] = [
  [["pending"], "Nuevos", "border-orange-400"],
  [["accepted", "preparing"], "En preparación", "border-amber-400"],
  [["ready"], "Listos", "border-emerald-500"],
];

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
}: {
  restaurantId: string;
  currency: string;
  initialOrders: KitchenOrder[];
}) {
  const [orders, setOrders] = useState(initialOrders);
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
    const delayedRefresh = () => {
      window.setTimeout(() => void refreshOrders(), 150);
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
      .subscribe();
    const polling = window.setInterval(() => void refreshOrders(), 3000);
    const refreshVisible = () => {
      if (document.visibilityState === "visible") void refreshOrders();
    };
    window.addEventListener("focus", refreshVisible);
    document.addEventListener("visibilitychange", refreshVisible);
    void refreshOrders();
    return () => {
      window.clearInterval(polling);
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
    startTransition(async () => {
      try {
        await transitionDiningOrder(id, status);
        await refreshOrders(true);
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "No se pudo actualizar el pedido.",
        );
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Pantalla de cocina</h1>
          <p className="mt-1 text-sm text-slate-600">
            Las comandas se sincronizan automáticamente cada pocos segundos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void enableOperations()}
          className={`inline-flex min-h-11 items-center gap-2 border px-4 py-2 text-sm font-bold ${operationsEnabled ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-stone-300 bg-white"}`}
        >
          {screenAwake ? <MonitorCheck size={17} /> : <BellRing size={17} />}
          <span>
            {operationsEnabled
              ? screenAwake
                ? "Avisos y pantalla activos"
                : "Avisos activos"
              : "Activar modo cocina"}
          </span>
        </button>
      </div>
      {operationsEnabled && !screenAwake && (
        <p className="mt-3 text-xs text-amber-700">
          Este dispositivo no permite mantener la pantalla encendida. Desactiva
          el bloqueo automático mientras uses cocina.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-4 border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-700"
        >
          {error}
        </p>
      )}
      <div className="mt-6 grid min-h-[60vh] gap-4 lg:grid-cols-3">
        {columns.map(([statuses, title, tone]) => {
          const visible = orders.filter((order) =>
            statuses.includes(order.status),
          );
          return (
            <section
              key={title}
              className={`border-t-4 ${tone} bg-stone-100 p-3`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-extrabold">{title}</h2>
                <span className="grid h-7 min-w-7 place-items-center bg-white px-2 text-xs font-black shadow-sm">
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
                  <div className="border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-slate-500">
                    Sin pedidos
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
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
    <article className="border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
            Pedido #{order.number}
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
      <ul className="mt-4 space-y-3 border-y border-stone-200 py-4">
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
          <li className="text-sm font-semibold text-amber-800">
            Cargando el detalle del pedido…
          </li>
        )}
      </ul>
      <p className="mt-3 text-right text-sm font-black">
        {new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(
          order.subtotalCents / 100,
        )}
      </p>
      <div className="mt-4 grid gap-2">
        {order.status === "pending" && (
          <>
            <button
              disabled={disabled}
              onClick={() => move(order.id, "accepted")}
              className="inline-flex min-h-11 items-center justify-center gap-2 bg-orange-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              <ChefHat size={17} />
              Aceptar
            </button>
            <button
              disabled={disabled}
              onClick={() => move(order.id, "rejected")}
              className="inline-flex items-center justify-center gap-2 border border-red-300 px-4 py-2 text-xs font-bold text-red-700"
            >
              <X size={15} />
              Rechazar
            </button>
          </>
        )}
        {order.status === "accepted" && (
          <button
            disabled={disabled}
            onClick={() => move(order.id, "preparing")}
            className="min-h-11 bg-amber-500 px-4 py-2 text-sm font-bold"
          >
            Empezar preparación
          </button>
        )}
        {order.status === "preparing" && (
          <button
            disabled={disabled}
            onClick={() => move(order.id, "ready")}
            className="inline-flex min-h-11 items-center justify-center gap-2 bg-emerald-700 px-4 py-2 text-sm font-bold text-white"
          >
            <Check size={17} />
            Marcar listo
          </button>
        )}
        {(order.status === "accepted" || order.status === "preparing") && (
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
            className="min-h-11 bg-slate-900 px-4 py-2 text-sm font-bold text-white"
          >
            Entregado
          </button>
        )}
      </div>
    </article>
  );
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}
