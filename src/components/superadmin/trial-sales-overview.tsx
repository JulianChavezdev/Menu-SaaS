import { CircleDollarSign, Clock3, Target, UsersRound } from "lucide-react";
import type { TrialSalesInput } from "@/lib/trial-sales";
import { trialSalesSnapshot } from "@/lib/trial-sales";

export function TrialSalesOverview({
  restaurants,
}: {
  restaurants: TrialSalesInput[];
}) {
  const snapshot = trialSalesSnapshot(restaurants);
  const peak = Math.max(1, ...Object.values(snapshot.interests));
  return (
    <section className="mt-6 border border-stone-200 bg-white p-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-700">
          Embudo comercial
        </p>
        <h2 className="mt-1 text-xl font-bold">Pruebas y planes elegidos</h2>
        <p className="mt-1 text-sm text-slate-600">
          Interés declarado durante el alta y situación actual de cada
          restaurante.
        </p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          icon={<UsersRound size={17} />}
          label="Registrados"
          value={snapshot.registered}
        />
        <Metric
          icon={<Clock3 size={17} />}
          label="En prueba"
          value={snapshot.trials}
        />
        <Metric
          icon={<Target size={17} />}
          label="Vencen en 7 días"
          value={snapshot.expiringSoon}
          warning={snapshot.expiringSoon > 0}
        />
        <Metric
          icon={<CircleDollarSign size={17} />}
          label="Conversión cerrada"
          value={`${snapshot.conversionRate}%`}
        />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Interest
          label="Plan Carta"
          value={snapshot.interests.carta}
          peak={peak}
        />
        <Interest
          label="Menuly Comandas"
          value={snapshot.interests.pedidos}
          peak={peak}
        />
        <Interest
          label="Configuración completa"
          value={snapshot.interests.configuracion}
          peak={peak}
        />
      </div>
      <p className="mt-4 text-xs text-slate-500">
        La conversión compara planes activos frente a pruebas ya finalizadas o
        suspendidas. Las pruebas abiertas todavía no cuentan como ganadas ni
        perdidas.
      </p>
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
  warning = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  warning?: boolean;
}) {
  return (
    <div
      className={`border p-4 ${warning ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-stone-50"}`}
    >
      <p
        className={`flex items-center gap-2 text-xs font-semibold uppercase ${warning ? "text-amber-800" : "text-slate-500"}`}
      >
        {icon}
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tabular-nums">{value}</p>
    </div>
  );
}
function Interest({
  label,
  value,
  peak,
}: {
  label: string;
  value: number;
  peak: number;
}) {
  return (
    <div className="border border-stone-200 p-4">
      <div className="flex justify-between gap-3 text-sm">
        <strong>{label}</strong>
        <span className="tabular-nums text-slate-600">{value}</span>
      </div>
      <div className="mt-3 h-2 bg-stone-100">
        <div
          className="h-full bg-orange-600"
          style={{ width: `${(value / peak) * 100}%` }}
        />
      </div>
    </div>
  );
}
