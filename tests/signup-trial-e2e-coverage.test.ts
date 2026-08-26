import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const flow = readFileSync("tests/e2e/restaurant-flow.spec.ts", "utf8");

describe("signup activation e2e coverage", () => {
  it("keeps new restaurants pending until manual activation", () => {
    expect(flow).toMatch(/subscription_status:\s*"past_due"/);
    expect(flow).not.toMatch(/subscription_status:\s*"trialing"/);
    expect(flow).toContain('provider:"manual"');
  });
  it("covers plan preselection, guide and persisted entitlement", () => {
    for (const copy of [
      "/register?plan=pedidos",
      "/dashboard/getting-started",
      "signup_plan_interest",
      "ordering_enabled",
      "current_period_end",
    ])
      expect(flow).toContain(copy);
  });
});
