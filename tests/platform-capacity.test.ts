import {describe,expect,it} from "vitest";
import {capacitySnapshot,DEFAULT_RESTAURANT_CAPACITY,resourceSnapshot,restaurantCapacity,storageCapacityGb} from "../src/lib/platform-capacity";

describe("restaurant capacity planning",()=>{
  it("uses a conservative configurable default",()=>{
    expect(DEFAULT_RESTAURANT_CAPACITY).toBe(25);
    expect(restaurantCapacity(undefined)).toBe(25);
    expect(restaurantCapacity("100")).toBe(100);
    expect(restaurantCapacity("0")).toBe(25);
    expect(restaurantCapacity("not-a-number")).toBe(25);
  });

  it("reports healthy, warning and exceeded states",()=>{
    expect(capacitySnapshot(5,25)).toMatchObject({percent:20,remaining:20,level:"healthy"});
    expect(capacitySnapshot(20,25)).toMatchObject({percent:80,remaining:5,level:"warning"});
    expect(capacitySnapshot(28,25)).toMatchObject({percent:100,remaining:0,exceededBy:3,level:"critical"});
  });

  it("estimates storage pressure and hosted video transfer",()=>{
    expect(storageCapacityGb(undefined)).toBe(1);
    expect(storageCapacityGb("100")).toBe(100);
    expect(storageCapacityGb("invalid")).toBe(1);
    expect(resourceSnapshot({storageBytes:512*1024**2,videoBytes:300,uploadedVideos:3,hostedVideoViews:20,storageCapacityGb:1})).toMatchObject({storagePercent:50,averageVideoBytes:100,estimatedTransferBytes:2000});
  });
});
