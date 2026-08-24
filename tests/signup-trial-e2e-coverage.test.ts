import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const flow = readFileSync("tests/e2e/restaurant-flow.spec.ts", "utf8");

describe("signup trial e2e coverage", () => {
  it("keeps the trial instead of activating it through test-only database writes", () => {
    expect(flow).toMatch(/subscription_status:\s*"trialing"/);
    expect(flow).not.toMatch(/update\(\{\s*subscription_status:\s*"active"/);
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
