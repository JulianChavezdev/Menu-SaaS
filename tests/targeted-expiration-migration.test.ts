import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const sql=readFileSync("supabase/migrations/202608200004_targeted_manual_expiration.sql","utf8");
describe("targeted expiration",()=>{it("limits processing to the requested restaurant",()=>{expect(sql).toContain("subscription.restaurant_id = target_restaurant");expect(sql).toContain("where id=target_restaurant")});it("is service-role only",()=>{expect(sql).toContain("revoke all");expect(sql).toContain("grant execute")})});
