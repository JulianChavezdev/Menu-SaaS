import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("weekly analytics goals",()=>{
  const migration=readFileSync("supabase/migrations/202607170004_analytics_goals.sql","utf8");
  it("protects per-restaurant goals with RLS and bounded values",()=>{expect(migration).toContain("enable row level security");expect(migration).toContain("public.is_member(restaurant_id)");expect(migration).toContain("between 1 and 1000000");expect(migration).not.toContain("to anon")});
  it("renders progress and saves through a protected server action",()=>{const component=readFileSync("src/components/dashboard/analytics-goals.tsx","utf8");const page=readFileSync("src/app/dashboard/analytics/page.tsx","utf8");const actions=readFileSync("src/app/dashboard/actions.ts","utf8");expect(component).toContain("Objetivos semanales");expect(page).toContain("<AnalyticsGoals");expect(actions).toContain("saveAnalyticsGoals");expect(actions).toContain("activeRestaurant()")});
});
