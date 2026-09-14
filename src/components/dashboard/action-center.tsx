import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { RestaurantAlert } from "@/lib/restaurant-alerts";

export function ActionCenter({ alerts }: { alerts: RestaurantAlert[] }) {
  return (
    <section className="workspace-panel">
      <div className="workspace-section-header">
        <div>
          <h2>Pendiente de revisar</h2>
          <p>
            {alerts.length
              ? `${alerts.length} ${alerts.length === 1 ? "detalle para mejorar tu carta" : "detalles para mejorar tu carta"}`
              : "Tu carta está al día."}
          </p>
        </div>
        {!alerts.length && <Check size={18} className="text-emerald-700" />}
      </div>
      <div className="workspace-alert-list">
        {alerts.length ? (
          alerts.map((alert) => (
            <article key={alert.id} className="workspace-alert-row">
              <span className="workspace-alert-dot" data-tone={alert.tone} />
              <div>
                <h3>{alert.title}</h3>
                <p>{alert.description}</p>
                <Link href={alert.href} className="workspace-text-link mt-3">
                  {alert.action}
                  <ArrowRight size={13} />
                </Link>
              </div>
            </article>
          ))
        ) : (
          <p className="py-8 text-sm leading-6 text-slate-500">
            No hay acciones pendientes. Puedes seguir editando la carta o
            consultar la actividad de esta semana.
          </p>
        )}
      </div>
    </section>
  );
}
