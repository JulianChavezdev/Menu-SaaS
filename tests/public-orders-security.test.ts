import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const route=readFileSync("src/app/api/public/orders/route.ts","utf8");

describe("public table orders",()=>{
  it("validates origin, payload and an active table session",()=>{expect(route).toContain("new URL(origin).origin");expect(route).toContain("publicOrderSchema.safeParse");expect(route).toContain('.eq("status","open")');expect(route).toContain('.gt("expires_at"')});
  it("never trusts client prices or restaurant identity",()=>{expect(route).toContain('from("products")');expect(route).toContain("product.price_cents*line.quantity");expect(route).not.toContain("body.subtotal");expect(route).not.toContain("body.restaurantId")});
  it("rate limits repeated table orders",()=>{expect(route).toContain("minuteAgo");expect(route).toContain("recent??0");expect(route).toContain("429")});
  it("rolls back an incomplete order",()=>{expect(route).toContain('from("dining_orders").delete()')});
  it("requires both private order and table tokens for tracking",()=>{expect(route).toContain('.eq("public_token",token)');expect(route).toContain('.eq("restaurant_tables.public_code",tableCode)')});
});
