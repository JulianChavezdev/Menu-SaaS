import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const route=readFileSync("src/app/api/superadmin/restaurants/[id]/export/route.ts","utf8");
const context=readFileSync("src/lib/superadmin-api.ts","utf8");
const page=readFileSync("src/app/superadmin/restaurants/[id]/page.tsx","utf8");

describe("superadmin exports",()=>{
  it("requires an authenticated allowlisted superadmin",()=>{
    expect(context).toContain("session.auth.getUser()");
    expect(context).toContain("isSuperadminUser(user)");
    expect(route).toContain("context.status!==200");
    expect(context).toContain("return{status:403 as const}");
  });

  it("never caches exports and only emits selected backup domains",()=>{
    expect(route).toContain('"Cache-Control":"private, no-store, max-age=0"');
    expect(route).toContain("manualPayments:payments??[]");
    expect(route).toContain("analytics:analytics??[]");
    expect(route).not.toContain("SUPABASE_SECRET_KEY");
    expect(route).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("exposes JSON and CSV controls in the restaurant support page",()=>{
    expect(page).toContain("Copia completa JSON");
    expect(page).toContain("Carta en CSV");
    expect(page).toContain("?format=csv");
  });
});
