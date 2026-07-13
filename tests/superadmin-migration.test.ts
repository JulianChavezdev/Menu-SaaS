import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const sql=readFileSync("supabase/migrations/202607130005_superadmin_access.sql","utf8");

describe("superadmin access migration",()=>{
  it("adds suspension state and an audit log",()=>{expect(sql).toContain("access_suspended boolean");expect(sql).toContain("superadmin_audit_log")});
  it("blocks member writes while suspended",()=>{expect(sql).toContain("restaurant.access_suspended = false")});
  it("removes suspended restaurants from public reads",()=>{expect(sql).toContain("is_published and access_suspended = false")});
  it("does not grant browser roles access to audit records",()=>{expect(sql).toContain("revoke all on public.superadmin_audit_log from anon, authenticated")});
});
