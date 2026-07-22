import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const migration=readFileSync("supabase/migrations/202607220001_remove_free_trial.sql","utf8");

describe("paid access migration",()=>{
  it("makes paid activation the default",()=>{
    expect(migration).toContain("alter column subscription_status set default 'past_due'");
    expect(migration).toContain("alter column status set default 'past_due'");
  });
  it("preserves legacy data while disabling trial publication",()=>{
    expect(migration).toContain("where subscription_status = 'trialing'");
    expect(migration).toContain("publication_suspended_for_payment = true");
    expect(migration).not.toContain("delete from public.restaurants");
  });
  it("requires Plan Carta for new content",()=>expect(migration).toContain("An active Plan Carta is required"));
});
