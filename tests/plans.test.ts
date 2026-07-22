import {describe,expect,it} from "vitest";
import {PLAN_LIMITS,canCreateProduct,planForStatus} from "../src/lib/plans";

describe("Carta plan",()=>{
  it("allows products below the paid limit",()=>expect(canCreateProduct(99)).toBe(true));
  it("blocks the hundred-and-first paid product",()=>expect(canCreateProduct(PLAN_LIMITS.carta.products)).toBe(false));
  it("blocks content creation until a plan is active",()=>{
    expect(canCreateProduct(0,"pending",0)).toBe(false);
    expect(PLAN_LIMITS.pending.categories).toBe(0);
    expect(PLAN_LIMITS.pending.products).toBe(0);
  });
  it("defines one restaurant",()=>expect(PLAN_LIMITS.carta.restaurants).toBe(1));
  it("only unlocks the paid plan for active subscriptions",()=>{
    expect(planForStatus("active")).toBe("carta");
    expect(planForStatus("trialing")).toBe("pending");
    expect(planForStatus("past_due")).toBe("pending");
    expect(planForStatus("canceled")).toBe("pending");
  });
});
