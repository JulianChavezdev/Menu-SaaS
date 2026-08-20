import {describe,expect,it} from "vitest";
import {summarizeOrderAnalytics} from "../src/lib/order-analytics";

describe("order analytics",()=>{
  it("separates submitted, accepted and delivered orders",()=>{
    const result=summarizeOrderAnalytics([
      {status:"pending",subtotal_cents:1000,created_at:"2026-08-20T10:00:00Z"},
      {status:"rejected",subtotal_cents:1200,created_at:"2026-08-20T10:00:00Z"},
      {status:"delivered",subtotal_cents:1800,created_at:"2026-08-20T10:00:00Z",accepted_at:"2026-08-20T10:01:00Z",delivered_at:"2026-08-20T10:16:00Z"},
    ]);
    expect(result).toMatchObject({submitted:3,accepted:1,delivered:1,rejected:1,deliveredCents:1800,averageTicketCents:1800,acceptanceRate:33,deliveryRate:33,averageDeliveryMinutes:16});
  });
  it("returns safe zero values without orders",()=>expect(summarizeOrderAnalytics([])).toMatchObject({submitted:0,averageTicketCents:0,acceptanceRate:0,averageDeliveryMinutes:0}));
});
