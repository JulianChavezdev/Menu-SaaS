import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const migration=readFileSync("supabase/migrations/202608200002_thirty_day_signup_trial.sql","utf8");

describe("thirty day signup trial migration",()=>{
  it("allows active and trialing restaurants to create content",()=>expect(migration).toContain("current_status not in ('active', 'trialing')"));
  it("suspends publication without deleting restaurant content",()=>{
    expect(migration).toContain("publication_suspended_for_payment = true");
    expect(migration).toContain("is_published = false");
    expect(migration).not.toContain("delete from public.restaurants");
  });
  it("exposes its database policy version",()=>expect(migration).toContain("select 20260820"));
  it("stores and protects the commercial interest selected at signup",()=>{
    expect(migration).toContain("signup_plan_interest");
    expect(migration).toContain("'configuracion'");
    expect(migration).toContain("new.signup_plan_interest is distinct from old.signup_plan_interest");
  });
});
