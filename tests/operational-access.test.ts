import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canUseKitchen, canUseWaiter, memberHome } from "../src/lib/member-roles";

const dashboardLayout = readFileSync("src/app/dashboard/layout.tsx", "utf8");
const teamActions = readFileSync("src/app/dashboard/actions.ts", "utf8");
const posActions = readFileSync("src/app/dashboard/ordering/pos-actions.ts", "utf8");
const kitchenActions = readFileSync("src/app/dashboard/ordering/actions.ts", "utf8");

describe("restricted operational accounts", () => {
  it("routes each role to its correct home", () => {
    expect(memberHome("waiter")).toBe("/operaciones/comandero");
    expect(memberHome("kitchen")).toBe("/operaciones/cocina");
    expect(memberHome("owner")).toBe("/dashboard");
  });
  it("separates waiter and kitchen permissions", () => {
    expect(canUseWaiter("waiter")).toBe(true);
    expect(canUseWaiter("kitchen")).toBe(false);
    expect(canUseKitchen("kitchen")).toBe(true);
    expect(canUseKitchen("waiter")).toBe(false);
  });
  it("blocks operational roles from the management dashboard", () => {
    expect(dashboardLayout).toContain("isOperationalRole(member.role)");
    expect(dashboardLayout).toContain("redirect(memberHome(member.role))");
  });
  it("creates direct credentials and protects privileged server actions", () => {
    expect(teamActions).toContain("admin.auth.admin.createUser");
    expect(teamActions).toContain("email_confirm: true");
    expect(posActions).toContain("canUseWaiter(member.role)");
    expect(kitchenActions).toContain('orderingRestaurant("kitchen")');
  });
});
