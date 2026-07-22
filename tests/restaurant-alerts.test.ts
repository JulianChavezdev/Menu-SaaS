import {describe,expect,it} from "vitest";
import {restaurantAlerts} from "../src/lib/restaurant-alerts";

const ready={subscriptionStatus:"active",published:true,products:3,productsWithoutMedia:0,menuViews:20,cartAdds:4,recommendationAdds:1,hasLogo:true,hasContact:true};
describe("restaurant action center",()=>{
  it("stays empty for a healthy restaurant",()=>expect(restaurantAlerts(ready)).toEqual([]));
  it("prioritizes payment and publication risks",()=>{const alerts=restaurantAlerts({...ready,subscriptionStatus:"past_due",published:false});expect(alerts[0].id).toBe("payment");expect(alerts.some(item=>item.id==="publish")).toBe(true)});
  it("detects traffic, conversion and upsell opportunities",()=>{expect(restaurantAlerts({...ready,menuViews:0}).some(item=>item.id==="traffic")).toBe(true);expect(restaurantAlerts({...ready,cartAdds:0}).some(item=>item.id==="conversion")).toBe(true);expect(restaurantAlerts({...ready,recommendationAdds:0}).some(item=>item.id==="upsell")).toBe(true)});
  it("limits the dashboard to six ordered alerts",()=>expect(restaurantAlerts({subscriptionStatus:"canceled",published:false,products:2,productsWithoutMedia:2,menuViews:0,cartAdds:0,recommendationAdds:0,hasLogo:false,hasContact:false}).length).toBeLessThanOrEqual(6));
});
