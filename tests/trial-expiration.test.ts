import {describe,expect,it} from "vitest";
import {trialDaysRemaining,trialIsExpired} from "../src/lib/trial-expiration";

describe("seven-day trial",()=>{
  const now=new Date("2026-07-16T12:00:00.000Z");
  it("expires a trial at its period end",()=>expect(trialIsExpired("trialing","2026-07-16T12:00:00.000Z",now)).toBe(true));
  it("does not expire active subscriptions",()=>expect(trialIsExpired("active","2026-07-15T12:00:00.000Z",now)).toBe(false));
  it("shows whole remaining days",()=>expect(trialDaysRemaining("2026-07-18T11:00:00.000Z",now)).toBe(2));
});
