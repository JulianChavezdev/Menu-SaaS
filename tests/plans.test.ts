import {describe,expect,it} from "vitest";
import {PLAN_LIMITS,canCreateProduct,planForStatus} from "../src/lib/plans";

describe("Carta plan",()=>{
  it("allows products below the paid limit",()=>expect(canCreateProduct(99)).toBe(true));
  it("blocks the hundred-and-first paid product",()=>expect(canCreateProduct(PLAN_LIMITS.carta.products)).toBe(false));
  it("allows five trial products when each category is empty",()=>expect(canCreateProduct(4,"trial",0)).toBe(true));
  it("limits trial to one product per category",()=>expect(canCreateProduct(1,"trial",1)).toBe(false));
  it("limits trial to five total products and categories",()=>{
    expect(canCreateProduct(5,"trial",0)).toBe(false);
    expect(PLAN_LIMITS.trial.categories).toBe(5);
    expect(PLAN_LIMITS.trial.productsPerCategory).toBe(1);
  });
  it("defines one restaurant",()=>expect(PLAN_LIMITS.carta.restaurants).toBe(1));
  it("only unlocks the paid plan for active subscriptions",()=>{
    expect(planForStatus("active")).toBe("carta");
    expect(planForStatus("trialing")).toBe("trial");
    expect(planForStatus("past_due")).toBe("trial");
    expect(planForStatus("canceled")).toBe("trial");
  });
});
