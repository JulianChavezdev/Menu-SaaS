"use client";

import { useId, useMemo, useState } from "react";

type VisitDay = { date: string; views: number };
const shortDate = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const fullDate = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const formatDate = (value: string, full = false) =>
  (full ? fullDate : shortDate).format(new Date(`${value}T00:00:00Z`));

export function DailyVisitsChart({ series }: { series: VisitDay[] }) {
  const id = useId();
  const [selected, setSelected] = useState<number | null>(null);
  const stats = useMemo(() => {
    const total = series.reduce((sum, day) => sum + day.views, 0);
    const best = series.reduce<VisitDay | null>(
      (best, day) => (!best || day.views > best.views ? day : best),
      null,
    );
    return { total, best, average: series.length ? total / series.length : 0 };
  }, [series]);
  const max = Math.max(4, Math.ceil((stats.best?.views ?? 0) / 4) * 4);
  const active =
    selected === null ? null : Math.min(selected, series.length - 1);
  const day = active === null ? null : series[active];
  const point = (index: number) => ({
    x: series.length === 1 ? 360 : (index / (series.length - 1)) * 720,
    y: 190 - (series[index].views / max) * 180,
  });
  const points = series
    .map((_, index) => {
      const p = point(index);
      return `${p.x},${p.y}`;
    })
    .join(" ");
  const ticks = [
    ...new Set([
      0,
      Math.floor((series.length - 1) / 4),
      Math.floor((series.length - 1) / 2),
      Math.floor(((series.length - 1) * 3) / 4),
      series.length - 1,
    ]),
  ].filter((index) => index >= 0);
  return (
    <section className="workspace-chart">
      <div className="workspace-chart-heading">
        <div>
          <h2>Visitas diarias</h2>
          <p>Aperturas de la carta durante el periodo.</p>
        </div>
        <div className="workspace-chart-readout" aria-live="polite">
          <strong>
            {day
              ? day.views.toLocaleString("es-ES")
              : stats.total.toLocaleString("es-ES")}{" "}
            <span className="text-xs font-normal text-slate-500">visitas</span>
          </strong>
          <p>{day ? formatDate(day.date) : `${series.length} días`}</p>
        </div>
      </div>
      <div className="mt-5 flex gap-3">
        <div
          aria-hidden="true"
          className="flex w-7 shrink-0 flex-col justify-between pb-7 pt-2 text-right text-[10px] tabular-nums text-slate-400"
        >
          {[max, max * 0.75, max * 0.5, max * 0.25, 0].map((value) => (
            <span key={value}>{value}</span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <svg
            viewBox="0 0 720 200"
            preserveAspectRatio="none"
            role="img"
            aria-labelledby={id}
            style={{ marginTop: 0 }}
            onPointerLeave={() => setSelected(null)}
          >
            <title
              id={id}
            >{`Visitas diarias: ${stats.total} aperturas en ${series.length} días. Usa el selector inferior para consultar cada día.`}</title>
            {[10, 55, 100, 145, 190].map((y) => (
              <line
                key={y}
                x1="0"
                x2="720"
                y1={y}
                y2={y}
                stroke="#e9eeea"
                strokeDasharray="3 5"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {series.length > 1 && (
              <polygon points={`0,190 ${points} 720,190`} fill="#edf3ed" />
            )}
            {series.length > 1 && (
              <polyline
                points={points}
                fill="none"
                stroke="#52765b"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
            {series.length === 1 && (
              <circle cx="360" cy={point(0).y} r="3" fill="#52765b" />
            )}
            {active !== null && day && (
              <g>
                <line
                  x1={point(active).x}
                  x2={point(active).x}
                  y1="5"
                  y2="190"
                  stroke="#9dae9d"
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx={point(active).x}
                  cy={point(active).y}
                  r="4"
                  fill="#365c48"
                  stroke="#fff"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            )}
            {series.map((item, index) => (
              <rect
                key={item.date}
                aria-hidden="true"
                x={Math.max(
                  0,
                  point(index).x - 360 / Math.max(1, series.length - 1),
                )}
                y="0"
                width={720 / Math.max(1, series.length - 1)}
                height="200"
                fill="transparent"
                onPointerEnter={() => setSelected(index)}
              />
            ))}
          </svg>
          <div
            aria-hidden="true"
            className="mt-2 flex justify-between text-[10px] text-slate-500"
          >
            {ticks.map((index) => (
              <time key={series[index].date} dateTime={series[index].date}>
                {formatDate(series[index].date)}
              </time>
            ))}
          </div>
          {series.length > 1 && (
            <input
              aria-label="Día del gráfico"
              type="range"
              min={0}
              max={series.length - 1}
              value={active ?? series.length - 1}
              aria-valuetext={`${formatDate(series[active ?? series.length - 1].date, true)}: ${series[active ?? series.length - 1].views} visitas`}
              onChange={(event) => setSelected(Number(event.target.value))}
              className="mt-3 h-1 w-full cursor-pointer accent-[#52765b]"
            />
          )}
        </div>
      </div>
      <div className="workspace-chart-footer">
        <span>
          Media diaria{" "}
          <strong>
            {stats.average.toLocaleString("es-ES", {
              maximumFractionDigits: 1,
            })}
          </strong>
        </span>
        {stats.best && stats.total > 0 ? (
          <span>
            Mejor día{" "}
            <strong>
              {formatDate(stats.best.date)} · {stats.best.views}
            </strong>
          </span>
        ) : (
          <span>Todavía no hay visitas registradas.</span>
        )}
      </div>
      <details className="mt-3 text-xs text-slate-500">
        <summary className="cursor-pointer py-1">
          Consultar datos por día
        </summary>
        <div className="mt-2 max-h-52 overflow-y-auto">
          <table className="w-full text-left">
            <caption className="sr-only">Visitas por fecha</caption>
            <thead>
              <tr>
                <th scope="col" className="py-2 font-medium">
                  Fecha
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  Visitas
                </th>
              </tr>
            </thead>
            <tbody>
              {series.map((item) => (
                <tr key={item.date}>
                  <th
                    scope="row"
                    className="border-t border-stone-100 py-2 font-normal"
                  >
                    {formatDate(item.date, true)}
                  </th>
                  <td className="border-t border-stone-100 py-2 text-right tabular-nums">
                    {item.views}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
