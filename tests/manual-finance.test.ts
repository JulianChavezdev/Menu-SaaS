import {describe,expect,it} from "vitest";
import {formatCurrencyTotals,isFinancialRestaurant,manualFinanceSnapshot} from "../src/lib/manual-finance";

describe("resumen financiero manual",()=>{
  const now=new Date("2026-07-15T12:00:00Z");
  it("agrupa por mes sin mezclar monedas",()=>{const result=manualFinanceSnapshot([{amount_cents:2500,currency:"EUR",paid_at:"2026-07-10T10:00:00Z"},{amount_cents:1000,currency:"USD",paid_at:"2026-07-11T10:00:00Z"},{amount_cents:1500,currency:"EUR",paid_at:"2026-06-01T10:00:00Z"}],now);expect(result.current).toMatchObject({key:"2026-07",count:2,totals:{EUR:2500,USD:1000}});expect(result.previous).toMatchObject({key:"2026-06",count:1,totals:{EUR:1500}})});
  it("formatea cada moneda por separado",()=>{const formatted=formatCurrencyTotals({EUR:2500,USD:1000});expect(formatted).toContain("25,00");expect(formatted).toContain("10,00");expect(formatted).toContain("·")});
  it("excluye la demo técnica de las finanzas",()=>{expect(isFinancialRestaurant("bistro-nube")).toBe(false);expect(isFinancialRestaurant("illegal-food")).toBe(true)});
});
