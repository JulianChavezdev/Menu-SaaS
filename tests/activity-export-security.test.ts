import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const route=readFileSync("src/app/api/superadmin/activity/export/route.ts","utf8");
describe("exportación privada de actividad",()=>{it("exige superadmin, evita caché y limita resultados",()=>{expect(route).toContain("superadminApiContext");expect(route).toContain('status:context.status');expect(route).toContain('private, no-store');expect(route).toContain("limit(5000)")})});
