import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const panel=readFileSync("src/components/superadmin/manual-payment-panel.tsx","utf8");
const actions=readFileSync("src/app/superadmin/actions.ts","utf8");

describe("registro de pagos manuales",()=>{
  it("permite elegir el método y usa una etiqueta genérica",()=>{
    expect(panel).toContain('name="method"');
    expect(panel).toContain('value="bank_transfer"');
    expect(panel).toContain("Registrar pago y activar plan");
    expect(panel).not.toContain("Confirmar Bizum");
  });

  it("valida y envía el método seleccionado",()=>{
    expect(actions).toContain('z.enum(["bizum","cash","bank_transfer","other"])');
    expect(actions).toContain("payment_method:parsed.data.method");
    expect(actions).toContain("method:parsed.data.method");
  });
});
