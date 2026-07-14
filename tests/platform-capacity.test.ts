import {describe,expect,it} from "vitest";
import {capacitySnapshot,DEFAULT_RESTAURANT_CAPACITY,restaurantCapacity} from "../src/lib/platform-capacity";

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
});
