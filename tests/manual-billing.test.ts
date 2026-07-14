import {describe,expect,it} from "vitest";
import {defaultManualPeriodEnd,manualBillingState} from "../src/lib/manual-billing";

describe("manual billing",()=>{
  const now=new Date("2026-07-14T10:00:00Z");
  it("classifies missing, current, upcoming and overdue periods",()=>{expect(manualBillingState(null,now)).toBe("none");expect(manualBillingState("2026-08-14T10:00:00Z",now)).toBe("current");expect(manualBillingState("2026-07-18T10:00:00Z",now)).toBe("due_soon");expect(manualBillingState("2026-07-13T10:00:00Z",now)).toBe("overdue")});
  it("suggests a one-month period",()=>expect(defaultManualPeriodEnd(now)).toBe("2026-08-14"));
});
