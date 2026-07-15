import {describe,expect,it} from "vitest";
import {describeAuditEvent,isAuditGroup} from "../src/lib/audit-events";

describe("eventos de auditoría",()=>{
  it("clasifica y traduce eventos conocidos",()=>{
    expect(describeAuditEvent("access.suspended",{})).toMatchObject({title:"Acceso suspendido",group:"access",tone:"danger"});
    expect(describeAuditEvent("payment.manual_recorded",{amount_cents:2500,currency:"EUR"})).toMatchObject({title:"Pago registrado",group:"payments",tone:"success"});
    expect(describeAuditEvent("platform.trash_cleanup_completed",{processed:2,failed:0})).toMatchObject({group:"system",tone:"success"});
  });
  it("oculta detalles desconocidos y valida filtros",()=>{
    expect(describeAuditEvent("unknown.action",{secret:"no mostrar"}).description).not.toContain("no mostrar");
    expect(isAuditGroup("payments")).toBe(true);expect(isAuditGroup("secrets")).toBe(false);
  });
});
