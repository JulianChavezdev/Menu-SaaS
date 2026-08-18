import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const sql=readFileSync("supabase/migrations/202608180001_table_ordering.sql","utf8");

describe("table ordering migration",()=>{
  it("keeps public order writes behind the trusted API",()=>{expect(sql).toContain("alter table public.dining_orders enable row level security");expect(sql).not.toMatch(/create policy[^;]+dining_orders[^;]+for insert/is)});
  it("isolates all staff reads by restaurant membership",()=>{expect(sql).toContain('policy "members read dining orders"');expect(sql).toContain("public.is_member(restaurant_id)");expect(sql).toContain("public.can_edit(restaurant_id)")});
  it("permits only one open session per table",()=>expect(sql).toContain("table_sessions_one_open_per_table_idx"));
  it("uses an unguessable public tracking token",()=>expect(sql).toContain("public_token uuid not null default gen_random_uuid() unique"));
  it("protects the commercial entitlement",()=>expect(sql).toContain("new.ordering_enabled is distinct from old.ordering_enabled"));
});
