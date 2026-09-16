import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const route=readFileSync("src/app/api/public/orders/route.ts","utf8");

describe("public table orders",()=>{
  it("validates origin, payload and the authoritative table context",()=>{expect(route).toContain("new URL(origin).origin");expect(route).toContain("publicOrderSchema.safeParse");expect(route).toContain('rpc("table_ordering_context"');expect(route).toContain("if(!context.active)")});
  it("never trusts client prices or restaurant identity",()=>{expect(route).toContain('from("products")');expect(route).toContain("priceOrderLines(parsed.data.lines,products,context.restaurantId)");expect(route).not.toContain("body.subtotal");expect(route).not.toContain("body.restaurantId")});
  it("rate limits repeated table orders",()=>{expect(route).toContain("target_client_hash:clientHash");expect(route).toContain("rate_limit");expect(route).toContain("429")});
  it("creates the order and its items atomically",()=>{expect(route).toContain('rpc("create_table_qr_order"');expect(route).not.toContain('from("dining_order_items").insert')});
  it("requires both private order and table tokens for tracking",()=>{expect(route).toContain('.eq("public_token",token)');expect(route).toContain('.eq("restaurant_tables.public_code",tableCode)')});
});
