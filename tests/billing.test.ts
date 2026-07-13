import {describe,expect,it} from "vitest";
import {buildCheckoutParams,checkoutIsConfigured} from "../src/lib/billing";

describe("billing checkout",()=>{
  it("builds a subscription checkout bound to the restaurant",()=>{const params=buildCheckoutParams({priceId:"price_test",restaurantId:"restaurant-123",appUrl:"https://menu.example",email:"owner@example.com"});expect(params.get("mode")).toBe("subscription");expect(params.get("client_reference_id")).toBe("restaurant-123");expect(params.get("line_items[0][price]")).toBe("price_test");expect(params.get("subscription_data[metadata][restaurant_id]")).toBe("restaurant-123");expect(params.get("customer_email")).toBe("owner@example.com")});
  it("uses safe success and cancellation URLs",()=>{const params=buildCheckoutParams({priceId:"price_test",restaurantId:"restaurant-123",appUrl:"https://menu.example"});expect(params.get("success_url")).toBe("https://menu.example/dashboard/billing?checkout=success");expect(params.get("cancel_url")).toBe("https://menu.example/dashboard/billing?checkout=canceled")});
  it("allows localhost and rejects insecure production URLs",()=>{expect(()=>buildCheckoutParams({priceId:"price_test",restaurantId:"id",appUrl:"http://localhost:3000"})).not.toThrow();expect(()=>buildCheckoutParams({priceId:"price_test",restaurantId:"id",appUrl:"http://menu.example"})).toThrow("HTTPS")});
  it("requires both Stripe server values",()=>{expect(checkoutIsConfigured("sk_test_example","price_example")).toBe(true);expect(checkoutIsConfigured(undefined,"price_example")).toBe(false);expect(checkoutIsConfigured("sk_test_example",undefined)).toBe(false)});
});
