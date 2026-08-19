import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const sql=readFileSync("supabase/migrations/202608190001_ordering_relationships.sql","utf8");

describe("ordering relationships migration",()=>{
  it("removes duplicate PostgREST relationships",()=>{
    expect(sql).toContain("table_sessions_table_id_fkey");
    expect(sql).toContain("dining_orders_table_id_fkey");
    expect(sql).toContain("dining_orders_table_session_id_fkey");
    expect(sql).toContain("dining_order_items_order_id_fkey");
  });
});
