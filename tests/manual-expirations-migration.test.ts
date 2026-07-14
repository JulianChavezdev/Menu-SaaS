import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const sql=readFileSync("supabase/migrations/202607140002_manual_expiration_operations.sql","utf8");

describe("manual expiration operations",()=>{
  it("limits grace periods and manual providers",()=>{expect(sql).toContain("grace_days < 0 or grace_days > 30");expect(sql).toContain("subscription.provider = 'manual'")});
  it("separates pending status from explicit suspension",()=>{expect(sql).toContain("not suspend_access and subscription.status = 'active'");expect(sql).toContain("access_suspended = case when suspend_access then true")});
  it("is idempotent and audits affected restaurants",()=>{expect(sql).toContain("restaurant.access_suspended = false");expect(sql).toContain("superadmin_audit_log");expect(sql).toContain("'bulk', true")});
  it("is service-role only",()=>{expect(sql).toContain("revoke all on function public.process_manual_expirations");expect(sql).toContain("grant execute on function public.process_manual_expirations")});
});
