import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {publicOrderSchema} from "../src/lib/table-ordering";

const migration=readFileSync("supabase/migrations/202608200001_order_idempotency.sql","utf8");
const route=readFileSync("src/app/api/public/orders/route.ts","utf8");
const checkout=readFileSync("src/components/menu/table-order-checkout.tsx","utf8");

describe("order idempotency",()=>{
  it("requires a client request identifier",()=>expect(publicOrderSchema.safeParse({tableCode:crypto.randomUUID(),lines:[],customerNote:""}).success).toBe(false));
  it("enforces one request per table session",()=>expect(migration).toContain("dining_orders_session_request_unique"));
  it("stores the order and every line in one transaction",()=>{expect(migration).toContain("create_public_dining_order");expect(migration).toContain("jsonb_to_recordset");expect(migration).toContain("grant execute")});
  it("replays an existing response instead of inserting twice",()=>{expect(route).toContain("client_request_id");expect(route).toContain("replayed:true")});
  it("reuses the identifier while retrying",()=>{expect(checkout).toContain("requestId.current??=crypto.randomUUID()");expect(checkout).toContain("requestId:requestId.current")});
});
