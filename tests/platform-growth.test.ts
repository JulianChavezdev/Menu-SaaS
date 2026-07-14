import {describe,expect,it} from "vitest";
import {platformGrowth} from "../src/lib/platform-growth";

describe("platform growth forecast",()=>{
  const now=new Date("2026-07-14T12:00:00.000Z");

  it("builds six monthly buckets and forecasts capacity",()=>{
    const dates=["2026-07-10","2026-07-01","2026-06-20","2026-05-15"].map(value=>`${value}T12:00:00.000Z`);
    const growth=platformGrowth(dates,10,now);
    expect(growth.months).toHaveLength(6);
    expect(growth.months.slice(-3).map(item=>item.added)).toEqual([1,1,2]);
    expect(growth).toMatchObject({total:4,last30:3,previous30:1,trend:2,remaining:6});
    expect(growth.monthlyRate).toBeCloseTo(1.3,1);
    expect(growth.monthsToCapacity).toBeGreaterThan(4);
  });

  it("avoids invented projections without recent growth",()=>{
    const growth=platformGrowth(["2025-01-01T00:00:00.000Z"],25,now);
    expect(growth.monthlyRate).toBe(0);
    expect(growth.monthsToCapacity).toBeNull();
    expect(growth.projectedDate).toBeNull();
  });
});
