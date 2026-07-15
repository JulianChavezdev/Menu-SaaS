import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const inbox=readFileSync("src/components/superadmin/collections-inbox.tsx","utf8");
const finance=readFileSync("src/app/superadmin/finance/page.tsx","utf8");
const actions=readFileSync("src/app/superadmin/actions.ts","utf8");

describe("bandeja central de cobros",()=>{
  it("ofrece canales manuales y avisa que no hay envíos automáticos",()=>{expect(inbox).toContain("Ningún mensaje se envía automáticamente");expect(inbox).toContain("WhatsApp");expect(inbox).toContain("Correo");expect(inbox).toContain("Copiar")});
  it("consulta solo avisos auditados y muestra el último contacto",()=>{expect(finance).toContain('eq("action","payment.reminder_prepared")');expect(finance).toContain("lastContact");expect(inbox).toContain("Último aviso preparado")});
  it("refresca la central después de registrar el canal",()=>{expect(actions).toContain('revalidatePath("/superadmin/finance")')});
});
