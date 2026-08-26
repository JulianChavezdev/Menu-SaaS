import Link from "next/link";
import { AlertTriangle, BellRing, Building2, Globe2 } from "lucide-react";
import { requireSuperadmin } from "@/lib/superadmin";

type AlertRow = {
  id: string;
  restaurant_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
  restaurants: { name?: string; slug?: string } | { name?: string; slug?: string }[] | null;
};

const styles = {
  "alert.failure": { label: "Fallo", icon: AlertTriangle, tone: "border-red-300 bg-red-50 text-red-950" },
  "alert.registration": { label: "Nuevo registro", icon: Building2, tone: "border-orange-300 bg-orange-50 text-orange-950" },
  "alert.menu_created": { label: "Carta creada", icon: Building2, tone: "border-amber-300 bg-amber-50 text-amber-950" },
  "alert.published": { label: "Carta publicada", icon: Globe2, tone: "border-emerald-300 bg-emerald-50 text-emerald-950" },
} as const;

export default async function AlertsPage() {
  const { admin } = await requireSuperadmin();
  const { data, error } = await admin.from("superadmin_audit_log").select("id,restaurant_id,action,details,created_at,restaurants(name,slug)").like("action", "alert.%").order("created_at", { ascending: false }).limit(200);
  if (error) throw new Error(error.message);
  const alerts = (data ?? []) as AlertRow[];
  return <main className="mx-auto max-w-5xl p-4 md:p-6">
    <div className="flex items-start gap-3"><span className="grid size-12 shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-700"><BellRing size={23}/></span><div><p className="text-xs font-bold uppercase tracking-[.18em] text-orange-700">Supervisión</p><h1 className="mt-1 text-3xl font-extrabold">Alertas</h1><p className="mt-1 text-sm text-slate-600">Nuevas altas, cartas creadas o publicadas y fallos detectados por el servidor.</p></div></div>
    <section className="mt-6 space-y-3" aria-label="Alertas recientes">{alerts.map((alert) => {
      const style = styles[alert.action as keyof typeof styles] ?? styles["alert.failure"];
      const Icon = style.icon;
      const details = alert.details ?? {};
      const relation = Array.isArray(alert.restaurants) ? alert.restaurants[0] : alert.restaurants;
      return <article key={alert.id} className={`border p-4 ${style.tone}`}><div className="flex items-start gap-3"><Icon className="mt-0.5 shrink-0" size={19}/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">{String(details.title ?? style.label)}</h2><time className="text-xs opacity-70">{new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(alert.created_at))}</time></div><p className="mt-1 text-sm opacity-80">{String(details.message ?? style.label)}</p>{relation?.name && <p className="mt-2 text-xs font-semibold">{relation.name}</p>}{alert.restaurant_id && <Link href={`/superadmin/restaurants/${alert.restaurant_id}`} className="mt-3 inline-block text-xs font-bold underline underline-offset-4">Abrir restaurante</Link>}</div></div></article>;
    })}{!alerts.length && <div className="border border-dashed border-stone-300 bg-white p-10 text-center"><BellRing className="mx-auto text-slate-400"/><h2 className="mt-3 font-bold">Sin alertas todavía</h2></div>}</section>
  </main>;
}
