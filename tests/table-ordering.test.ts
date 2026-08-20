import {describe,expect,it} from "vitest";
import {canTransitionOrder,isOpenSession,publicOrderSchema,sessionExpiresAt} from "../src/lib/table-ordering";

describe("table ordering",()=>{
  it("accepts a bounded order",()=>expect(publicOrderSchema.safeParse({tableCode:"00000000-0000-4000-8000-000000000001",requestId:"00000000-0000-4000-8000-000000000003",lines:[{productId:"00000000-0000-4000-8000-000000000002",quantity:2,note:"Sin cebolla"}],customerNote:""}).success).toBe(true));
  it("rejects duplicated products and excessive quantities",()=>expect(publicOrderSchema.safeParse({tableCode:"00000000-0000-4000-8000-000000000001",requestId:"00000000-0000-4000-8000-000000000003",lines:[{productId:"00000000-0000-4000-8000-000000000002",quantity:21,note:""},{productId:"00000000-0000-4000-8000-000000000002",quantity:1,note:""}],customerNote:""}).success).toBe(false));
  it("only permits the kitchen workflow",()=>{expect(canTransitionOrder("pending","accepted")).toBe(true);expect(canTransitionOrder("pending","ready")).toBe(false);expect(canTransitionOrder("rejected","pending")).toBe(true);expect(canTransitionOrder("delivered","pending")).toBe(false)});
  it("expires sessions after the configured window",()=>{const now=new Date("2026-08-18T10:00:00Z");expect(sessionExpiresAt(now).toISOString()).toBe("2026-08-18T11:30:00.000Z");expect(isOpenSession({status:"open",expires_at:"2026-08-18T10:01:00Z"},now)).toBe(true);expect(isOpenSession({status:"open",expires_at:"2026-08-18T10:00:00Z"},now)).toBe(false)});
});
