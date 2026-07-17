import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("sales funnel UI",()=>{
  it("shows the path from menu visit to cart intention",()=>{const component=readFileSync("src/components/dashboard/sales-funnel.tsx","utf8");const page=readFileSync("src/app/dashboard/analytics/page.tsx","utf8");for(const label of ["Visitas a la carta","Productos vistos","Detalles consultados","Añadidos al carrito"])expect(component).toContain(label);expect(page).toContain("<SalesFunnel")});
});
