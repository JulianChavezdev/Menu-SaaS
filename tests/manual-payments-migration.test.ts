import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const sql=readFileSync("supabase/migrations/202607140001_manual_payments.sql","utf8");

describe("manual payments migration",()=>{
  it("creates a private payment ledger",()=>{expect(sql).toContain("create table if not exists public.manual_payments");expect(sql).toContain("revoke all on public.manual_payments from anon, authenticated")});
  it("requires positive amounts and a valid paid period",()=>{expect(sql).toContain("amount_cents > 0");expect(sql).toContain("period_end >= paid_at")});
  it("supports Bizum and clears stale Stripe identifiers",()=>{expect(sql).toContain("'bizum'");expect(sql).toContain("provider_subscription_id = null")});
  it("records the payment and activates access atomically",()=>{expect(sql).toContain("function public.record_manual_payment");expect(sql).toContain("subscription_status = 'active'");expect(sql).toContain("access_suspended = false")});
});
