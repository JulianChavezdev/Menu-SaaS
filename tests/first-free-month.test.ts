import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const actions=readFileSync("src/app/superadmin/actions.ts","utf8");
const panel=readFileSync("src/components/superadmin/manual-payment-panel.tsx","utf8");
const migration=readFileSync("supabase/migrations/202608200005_first_free_month.sql","utf8");

describe("primer mes gratis manual",()=>{
  it("ofrece una acción distinta al registro de pagos",()=>{
    expect(panel).toContain("Conceder mes gratis");
    expect(panel).toContain("sin crear un pago ni sumarlo a los ingresos");
    expect(actions).toContain('admin.rpc("grant_first_free_month"');
  });

  it("solo puede concederse una vez y no escribe en el libro de pagos",()=>{
    expect(migration).toContain("superadmin_first_free_month_once_idx");
    expect(migration).toContain("subscription.first_free_month_granted");
    expect(migration).toContain("now() + interval '30 days'");
    expect(migration).not.toContain("insert into public.manual_payments");
  });

  it("mantiene una prueba vigente sin ampliar su fecha",()=>{
    expect(migration).toContain("existing_status = 'trialing' and existing_end > now()");
    expect(migration).toContain("then existing_end");
  });
});
