import { describe, expect, it } from "vitest";
import {
  SIGNUP_PLANS,
  signupPlan,
  signupPlanName,
  trialDaysRemaining,
  trialUrgency,
} from "../src/lib/signup-plans";

describe("signup plans", () => {
  it("shows every current offer", () =>
    expect(SIGNUP_PLANS.map((plan) => plan.id)).toEqual([
      "carta",
      "pedidos",
      "configuracion",
    ]));
  it("rejects an untrusted plan", () =>
    expect(signupPlan("enterprise-inventado")).toBe("carta"));
  it("shows the exact monthly and annual prices", () => {
    expect(SIGNUP_PLANS.find((plan) => plan.id === "carta")?.price).toBe(
      "34,99 €/mes · 344,30 €/año",
    );
    expect(SIGNUP_PLANS.find((plan) => plan.id === "pedidos")?.price).toBe(
      "59,99 €/mes · 590,30 €/año",
    );
  });
  it("calculates the remaining whole days without negative values", () => {
    expect(
      trialDaysRemaining(
        "2026-08-22T11:00:00.000Z",
        new Date("2026-08-20T12:00:00.000Z"),
      ),
    ).toBe(2);
    expect(
      trialDaysRemaining(
        "2026-08-19T12:00:00.000Z",
        new Date("2026-08-20T12:00:00.000Z"),
      ),
    ).toBe(0);
    expect(signupPlanName("pedidos")).toBe("Menuly Comandas");
  });
  it("escalates conversion reminders as expiration approaches", () => {
    expect(trialUrgency(30)).toBe("normal");
    expect(trialUrgency(7)).toBe("soon");
    expect(trialUrgency(3)).toBe("urgent");
    expect(trialUrgency(1)).toBe("last-day");
    expect(trialUrgency(0)).toBe("last-day");
  });
});
