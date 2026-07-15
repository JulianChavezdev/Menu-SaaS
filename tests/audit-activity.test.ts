import {describe,expect,it} from "vitest";
import {activityCsv,activityItems,safeActivityDate,type AuditActivityRow} from "../src/lib/audit-activity";

const rows:AuditActivityRow[]=[{id:"1",actor_user_id:"admin",restaurant_id:"r1",action:"payment.manual_recorded",details:{amount_cents:2500,currency:"EUR"},created_at:"2026-07-15T10:00:00Z",restaurants:{name:"ILLEGAL FOOD",slug:"illegal-food"}},{id:"2",actor_user_id:null,restaurant_id:null,action:"platform.trash_cleanup_completed",details:{processed:0,failed:0},created_at:"2026-07-15T11:00:00Z",restaurants:null}];
describe("filtros y exportación de actividad",()=>{
  it("busca sin distinguir mayúsculas ni acentos y combina grupos",()=>{expect(activityItems(rows,{q:"illegal"})).toHaveLength(1);expect(activityItems(rows,{group:"payments",q:"pago"})).toHaveLength(1);expect(activityItems(rows,{group:"system"})).toHaveLength(1)});
  it("valida fechas reales",()=>{expect(safeActivityDate("2026-07-15")).toBe("2026-07-15T00:00:00.000Z");expect(safeActivityDate("2026-02-30")).toBeNull();expect(safeActivityDate("15/07/2026")).toBeNull()});
  it("exporta solo campos legibles y neutraliza fórmulas",()=>{const csv=activityCsv(activityItems(rows));expect(csv).toContain("Pago registrado");expect(csv).toContain("ILLEGAL FOOD");expect(csv).not.toContain("amount_cents");const malicious={...rows[0],restaurants:{name:"=CMD()",slug:"bad"}};expect(activityCsv(activityItems([malicious]))).toContain("'=CMD()")});
});
