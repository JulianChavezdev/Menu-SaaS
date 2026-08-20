import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const sql=readFileSync("supabase/migrations/202608200003_restaurant_sales_followup.sql","utf8");

describe("restaurant sales followup migration",()=>{
  it("stores one protected commercial state per restaurant",()=>{expect(sql).toContain("restaurant_id uuid primary key");expect(sql).toContain("enable row level security");expect(sql).toContain("revoke all on table")});
  it("supports the complete commercial workflow",()=>{for(const stage of["new","contacted","interested","converted","not_continuing"])expect(sql).toContain(`'${stage}'`)});
  it("is covered by the remote schema checker",()=>expect(readFileSync("scripts/check-db.mjs","utf8")).toContain("202608200003_restaurant_sales_followup.sql"));
});
