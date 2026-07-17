import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {analyticsChange,analyticsPeriodRange,analyticsReportCsv,parseAnalyticsPeriod} from "../src/lib/analytics-report";
import {summarizeAnalytics} from "../src/lib/analytics";

describe("restaurant analytics reports",()=>{
  it("accepts only supported periods",()=>{expect(parseAnalyticsPeriod("7")).toBe(7);expect(parseAnalyticsPeriod("90")).toBe(90);expect(parseAnalyticsPeriod("999")).toBe(30);expect(parseAnalyticsPeriod(null)).toBe(30)});
  it("builds adjacent inclusive periods",()=>expect(analyticsPeriodRange(7,new Date("2026-07-17T20:00:00Z"))).toEqual({currentFrom:"2026-07-11",currentTo:"2026-07-17",previousFrom:"2026-07-04",previousTo:"2026-07-10"}));
  it("describes growth, decline and new activity",()=>{expect(analyticsChange(12,10)).toEqual({label:"+20%",tone:"up"});expect(analyticsChange(5,10)).toEqual({label:"-50%",tone:"down"});expect(analyticsChange(2,0)).toEqual({label:"Nuevo",tone:"up"})});
  it("exports commercial metrics and neutralizes spreadsheet formulas",()=>{const summary=summarizeAnalytics([{event_date:"2026-07-17",event_type:"product_view",event_count:4,product_id:"p1",products:{name:"=SUM(A1)",category_id:"c1",categories:{name:"Carta"}}},{event_date:"2026-07-17",event_type:"cart_add",event_count:2,product_id:"p1",products:{name:"=SUM(A1)",category_id:"c1",categories:{name:"Carta"}}}]);const csv=analyticsReportCsv(summary,"=Restaurante",30);expect(csv).toContain("Informe comercial");expect(csv).toContain("Tasa de añadido");expect(csv).toContain("50%");expect(csv).toContain("'=Restaurante");expect(csv).toContain("'=SUM(A1)")});
  it("protects the export with restaurant membership and private caching",()=>{const route=readFileSync("src/app/api/dashboard/analytics/export/route.ts","utf8");expect(route).toContain("activeRestaurant()");expect(route).toContain('"Cache-Control":"private, no-store"');expect(route).toContain("parseAnalyticsPeriod")});
});
