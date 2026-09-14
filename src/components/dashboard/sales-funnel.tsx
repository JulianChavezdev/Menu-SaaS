type Stage = { label: string; value: number; note: string };
export function SalesFunnel({
  menuViews,
  productViews,
  detailOpens,
  cartAdds,
}: {
  menuViews: number;
  productViews: number;
  detailOpens: number;
  cartAdds: number;
}) {
  const stages: Stage[] = [
    {
      label: "Visitas a la carta",
      value: menuViews,
      note: "Aperturas de la carta",
    },
    {
      label: "Productos vistos",
      value: productViews,
      note: `${rate(productViews, menuViews)} por cada 100 visitas`,
    },
    {
      label: "Detalles consultados",
      value: detailOpens,
      note: `${rate(detailOpens, productViews)} por cada 100 productos vistos`,
    },
    {
      label: "Añadidos al carrito",
      value: cartAdds,
      note: `${rate(cartAdds, productViews)} por cada 100 productos vistos`,
    },
  ];
  const peak = Math.max(1, ...stages.map((item) => item.value));
  return (
    <section className="workspace-panel">
      <div className="workspace-section-header">
        <div>
          <h2>Recorrido de la carta</h2>
          <p>
            Recuentos de acciones; una visita puede generar varias
            visualizaciones.
          </p>
        </div>
      </div>
      <div className="space-y-5 p-5">
        {stages.map((stage) => (
          <div key={stage.label}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-600">{stage.label}</span>
              <strong className="text-sm font-medium tabular-nums">
                {stage.value.toLocaleString("es-ES")}
              </strong>
            </div>
            <div className="mt-2 h-1 overflow-hidden bg-stone-100">
              <div
                className="h-full bg-[#64836b]"
                style={{ width: `${(stage.value / peak) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-[10px] text-slate-500">{stage.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
const rate = (value: number, total: number) =>
  total ? Math.round((value / total) * 100) : 0;
