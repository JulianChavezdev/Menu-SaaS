import {describe,expect,it} from "vitest";
import {SIGNUP_PLANS,signupPlan,trialEndsAt,TRIAL_DAYS} from "../src/lib/signup-plans";

describe("signup plans",()=>{
  it("shows every current offer",()=>expect(SIGNUP_PLANS.map(plan=>plan.id)).toEqual(["carta","pedidos","configuracion"]));
  it("rejects an untrusted plan",()=>expect(signupPlan("enterprise-inventado")).toBe("carta"));
  it("creates a thirty-day trial",()=>{
    const start=new Date("2026-08-20T12:00:00.000Z");
    expect(TRIAL_DAYS).toBe(30);
    expect(trialEndsAt(start).toISOString()).toBe("2026-09-19T12:00:00.000Z");
  });
});
