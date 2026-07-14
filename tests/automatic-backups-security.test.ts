import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const migration=readFileSync("supabase/migrations/202607140007_automatic_restaurant_backups.sql","utf8");
const collectionRoute=readFileSync("src/app/api/superadmin/restaurants/[id]/backups/route.ts","utf8");
const itemRoute=readFileSync("src/app/api/superadmin/restaurants/[id]/backups/[backupId]/route.ts","utf8");
const panel=readFileSync("src/components/superadmin/restaurant-restore-panel.tsx","utf8");

describe("automatic private restaurant backups",()=>{
  it("keeps the backup table unavailable to browser roles",()=>{
    expect(migration).toContain("alter table public.restaurant_backups enable row level security");
    expect(migration).toContain("revoke all on public.restaurant_backups from anon, authenticated");
    expect(migration).toContain("revoke all on function public.build_restaurant_backup(uuid) from public");
  });

  it("schedules daily snapshots and applies bounded retention",()=>{
    expect(migration).toContain("carta-daily-restaurant-backups");
    expect(migration).toContain("30 2 * * *");
    expect(migration).toContain("when 'daily' then 14");
    expect(migration).toContain("when 'pre_restore' then 10 else 20");
    expect(migration).not.toContain("manual_payments");
    expect(migration).not.toContain("restaurant_members");
  });

  it("authenticates all history mutations and avoids leaking database errors",()=>{
    expect(collectionRoute).toContain("superadminApiContext()");
    expect(itemRoute).toContain("superadminApiContext()");
    expect(collectionRoute).not.toContain("error.message");
    expect(itemRoute).not.toContain("error.message");
    expect(itemRoute).toContain('"Cache-Control":"private, no-store, max-age=0"');
  });

  it("offers manual creation, preview, download and two-step deletion",()=>{
    expect(panel).toContain("Crear punto ahora");
    expect(panel).toContain("loadStoredBackup");
    expect(panel).toContain("?download=1");
    expect(panel).toContain("Pulsa otra vez para eliminarla");
  });
});
