import {describe,expect,it} from "vitest";
import {trialSalesSnapshot} from "../src/lib/trial-sales";

describe("trial sales snapshot",()=>{
  const now=new Date("2026-08-20T12:00:00.000Z");
  const rows=[
    {status:"trialing",planInterest:"pedidos",periodEnd:"2026-08-25T12:00:00.000Z",isSuspended:false},
    {status:"trialing",planInterest:"carta",periodEnd:"2026-09-15T12:00:00.000Z",isSuspended:false},
    {status:"active",planInterest:"configuracion",periodEnd:null,isSuspended:false},
    {status:"past_due",planInterest:"invalid",periodEnd:null,isSuspended:false},
  ];
  it("separates open trials from decided conversions",()=>expect(trialSalesSnapshot(rows,now)).toMatchObject({registered:4,trials:2,expiringSoon:1,active:1,lost:1,conversionRate:50}));
  it("groups declared interest safely",()=>expect(trialSalesSnapshot(rows,now).interests).toEqual({carta:2,pedidos:1,configuracion:1}));
});
