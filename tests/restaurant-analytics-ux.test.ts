import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {analyticsGuidance} from "../src/lib/analytics-report";
import {summarizeAnalytics} from "../src/lib/analytics";

const page=readFileSync("src/app/dashboard/analytics/page.tsx","utf8");

describe("analíticas intuitivas para restaurantes",()=>{
  it("explica las métricas y prioriza una acción",()=>{
    for(const copy of["¿Qué está funcionando en tu carta?","Resumen de los últimos","Qué deberías hacer ahora","Una visita cuenta cada apertura","no confirma una venta"])expect(page).toContain(copy);
  });

  it("evita una tabla horizontal en móvil",()=>{
    expect(page).toContain('className="grid gap-3 p-4 md:hidden"');
    expect(page).toContain('className="hidden overflow-x-auto md:block"');
    expect(page).toContain("ProductCard");
  });

  it("genera recomendaciones comprensibles según el embudo",()=>{
    expect(analyticsGuidance(summarizeAnalytics([])).title).toBe("Consigue las primeras visitas");
    const views=summarizeAnalytics([{event_date:"2026-08-20",event_type:"menu_view",event_count:10},{event_date:"2026-08-20",event_type:"product_view",event_count:20,product_id:"p1",products:{name:"Burger"}}]);
    expect(analyticsGuidance(views).title).toBe("Hay interés, pero ningún añadido");
    const converting=summarizeAnalytics([{event_date:"2026-08-20",event_type:"menu_view",event_count:10},{event_date:"2026-08-20",event_type:"product_view",event_count:20,product_id:"p1",products:{name:"Burger"}},{event_date:"2026-08-20",event_type:"cart_add",event_count:5,product_id:"p1",products:{name:"Burger"}}]);
    expect(analyticsGuidance(converting).tone).toBe("positive");
  });
});
