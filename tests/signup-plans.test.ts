import {describe,expect,it} from "vitest";
import {SIGNUP_PLANS,signupPlan,signupPlanName,trialDaysRemaining,trialEndsAt,trialUrgency,TRIAL_DAYS} from "../src/lib/signup-plans";

describe("signup plans",()=>{
  it("shows every current offer",()=>expect(SIGNUP_PLANS.map(plan=>plan.id)).toEqual(["carta","pedidos","configuracion"]));
  it("rejects an untrusted plan",()=>expect(signupPlan("enterprise-inventado")).toBe("carta"));
  it("creates a thirty-day trial",()=>{
    const start=new Date("2026-08-20T12:00:00.000Z");
    expect(TRIAL_DAYS).toBe(30);
    expect(trialEndsAt(start).toISOString()).toBe("2026-09-19T12:00:00.000Z");
  });
  it("calculates the remaining whole days without negative values",()=>{
    expect(trialDaysRemaining("2026-08-22T11:00:00.000Z",new Date("2026-08-20T12:00:00.000Z"))).toBe(2);
    expect(trialDaysRemaining("2026-08-19T12:00:00.000Z",new Date("2026-08-20T12:00:00.000Z"))).toBe(0);
    expect(signupPlanName("pedidos")).toBe("Menuly Pedidos");
  });
  it("escalates conversion reminders as expiration approaches",()=>{
    expect(trialUrgency(30)).toBe("normal");
    expect(trialUrgency(7)).toBe("soon");
    expect(trialUrgency(3)).toBe("urgent");
    expect(trialUrgency(1)).toBe("last-day");
    expect(trialUrgency(0)).toBe("last-day");
  });
});
