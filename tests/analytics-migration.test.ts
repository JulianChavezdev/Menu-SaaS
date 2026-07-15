import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const sql=readFileSync("supabase/migrations/202607140003_privacy_safe_analytics.sql","utf8");
const extended=readFileSync("supabase/migrations/202607150001_extended_menu_analytics.sql","utf8");

describe("analytics migration",()=>{
  it("stores only daily aggregate dimensions",()=>{const tableDefinition=sql.split("create index")[0];expect(tableDefinition).toContain("menu_analytics_daily");expect(tableDefinition).toContain("event_count bigint");for(const forbidden of ["ip_address","user_agent","visitor_id","cookie"])expect(tableDefinition).not.toContain(forbidden)});
  it("validates public restaurants and product tenancy",()=>{expect(sql).toContain("is_published_restaurant(target_restaurant)");expect(sql).toContain("product.restaurant_id = target_restaurant")});
  it("allows members to read but only service role to record",()=>{expect(sql).toContain("members read menu analytics");expect(sql).toContain("grant execute on function public.record_menu_analytics_event");expect(sql).toContain("to service_role")});
  it("adds video and cart counters without personal tracking",()=>{expect(extended).toContain("'video_play'");expect(extended).toContain("'cart_add'");expect(extended).toContain("target_event in ('product_view','video_play','cart_add')");const executable=extended.split("comment on table")[0];for(const forbidden of["ip_address","user_agent","visitor_id","cookie"])expect(executable).not.toContain(forbidden)});
});
