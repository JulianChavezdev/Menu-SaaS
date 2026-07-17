import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("restaurant feedback",()=>{
  const migration=readFileSync("supabase/migrations/202607170003_restaurant_feedback.sql","utf8");
  it("stores private member feedback behind RLS",()=>{expect(migration).toContain("enable row level security");expect(migration).toContain("public.is_member(restaurant_id)");expect(migration).toContain("user_id=auth.uid()");expect(migration).toContain("between 10 and 2000");expect(migration).not.toContain("grant insert on public.restaurant_feedback to anon")});
  it("adds the box to billing and validates on the server",()=>{const billing=readFileSync("src/app/dashboard/billing/page.tsx","utf8");const action=readFileSync("src/app/dashboard/actions.ts","utf8");const component=readFileSync("src/components/dashboard/feedback-box.tsx","utf8");expect(billing).toContain("<FeedbackBox/>");expect(action).toContain("submitRestaurantFeedback");expect(action).toContain("activeRestaurant()");expect(component).toContain("qué añadirías, quitarías o mejorarías");expect(component).toContain("minLength={10}")});
  it("provides a protected superadmin inbox with a pending counter",()=>{const page=readFileSync("src/app/superadmin/feedback/page.tsx","utf8");const layout=readFileSync("src/app/superadmin/layout.tsx","utf8");expect(page).toContain("requireSuperadmin()");expect(page).toContain("updateRestaurantFeedback");expect(layout).toContain('/superadmin/feedback');expect(layout).toContain('eq("status","new")')});
});
