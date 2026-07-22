import {createHmac} from "node:crypto";
import {describe,expect,it} from "vitest";
import {invoiceSubscriptionId,mapStripeSubscriptionStatus,stripeId,stripePeriodEnd,verifyStripeSignature} from "../src/lib/stripe-webhook";

const payload=JSON.stringify({id:"evt_test",type:"invoice.paid"});const secret="whsec_test";const timestamp=1_700_000_000;
const signature=createHmac("sha256",secret).update(`${timestamp}.${payload}`).digest("hex");

describe("Stripe webhooks",()=>{
  it("accepts a valid signature",()=>expect(()=>verifyStripeSignature(payload,`t=${timestamp},v1=${signature}`,secret,timestamp)).not.toThrow());
  it("accepts one valid signature during secret rotation",()=>expect(()=>verifyStripeSignature(payload,`t=${timestamp},v1=00,v1=${signature}`,secret,timestamp)).not.toThrow());
  it("rejects invalid and expired signatures",()=>{expect(()=>verifyStripeSignature(payload,`t=${timestamp},v1=00`,secret,timestamp)).toThrow("no válida");expect(()=>verifyStripeSignature(payload,`t=${timestamp},v1=${signature}`,secret,timestamp+301)).toThrow("caducada")});
  it("maps Stripe states to local access states",()=>{expect(mapStripeSubscriptionStatus("active")).toBe("active");expect(mapStripeSubscriptionStatus("trialing")).toBe("past_due");expect(mapStripeSubscriptionStatus("past_due")).toBe("past_due");expect(mapStripeSubscriptionStatus("unpaid")).toBe("past_due");expect(mapStripeSubscriptionStatus("canceled")).toBe("canceled")});
  it("extracts expanded and string identifiers",()=>{expect(stripeId("sub_123")).toBe("sub_123");expect(stripeId({id:"sub_456"})).toBe("sub_456");expect(invoiceSubscriptionId({parent:{subscription_details:{subscription:"sub_new"}}})).toBe("sub_new")});
  it("converts Stripe epoch periods",()=>expect(stripePeriodEnd(1_700_000_000)).toBe("2023-11-14T22:13:20.000Z"));
});
