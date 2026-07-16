import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const migration=readFileSync("supabase/migrations/202607160001_seven_day_trial.sql","utf8");

describe("trial expiration migration",()=>{
  it("limits trials to seven days and suspends publication",()=>{
    expect(migration).toContain("interval '7 days'");
    expect(migration).toContain("publication_suspended_for_payment = true");
    expect(migration).toContain("is_published = false");
  });
  it("restores billing-suspended publication after payment",()=>{
    expect(migration).toContain("case when publication_suspended_for_payment then true else is_published end");
  });
});
