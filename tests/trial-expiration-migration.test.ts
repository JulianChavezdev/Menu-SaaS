import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const trialSetup=readFileSync("supabase/migrations/202607160001_seven_day_trial.sql","utf8");
const expiration=readFileSync("supabase/migrations/202607190001_trial_one_product_per_category_and_expiration_trash.sql","utf8");

describe("trial expiration migration",()=>{
  it("keeps the seven-day trial window",()=>expect(trialSetup).toContain("interval '7 days'"));
  it("backs up and deletes expired trial restaurants",()=>{
    expect(expiration).toContain("restaurant.deletion_backup_created");
    expect(expiration).toContain("'reason', 'trial_expired'");
    expect(expiration).toContain("delete from public.restaurants");
    expect(expiration).toContain("interval '30 days'");
  });
  it("never deletes the permanent showcase",()=>expect(expiration).toContain("restaurant.slug <> 'bistro-nube'"));
});
