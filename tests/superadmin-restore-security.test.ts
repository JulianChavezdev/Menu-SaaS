import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const route=readFileSync("src/app/api/superadmin/restaurants/[id]/restore/route.ts","utf8");
const migration=readFileSync("supabase/migrations/202607140006_restaurant_backup_restore.sql","utf8");
const panel=readFileSync("src/components/superadmin/restaurant-restore-panel.tsx","utf8");

describe("superadmin backup restoration",()=>{
  it("authenticates before parsing and limits request size",()=>{
    expect(route.indexOf("superadminApiContext()")).toBeLessThan(route.indexOf("request.text()"));
    expect(route).toContain("MAX_BACKUP_BYTES");
    expect(route).toContain('"Cache-Control":"private, no-store, max-age=0"');
    expect(route).not.toContain("restoreError.message");
  });

  it("requires an exact slug confirmation and uses one atomic RPC",()=>{
    expect(route).toContain("body.confirmation!==restaurant.slug");
    expect(route).toContain('admin.rpc("restore_restaurant_content"');
    expect(migration).toContain("for update");
    expect(migration).toContain("Service role required");
    expect(migration).toContain("restaurant.backup_restored");
    expect(migration).toContain("revoke all on function public.restore_restaurant_content");
  });

  it("provides preview-first controls",()=>{
    expect(panel).toContain('request("preview"');
    expect(panel).toContain("Escribe <strong>{restaurantSlug}</strong>");
    expect(panel).toContain("confirmation!==restaurantSlug");
  });
});
