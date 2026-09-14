import {describe,expect,it} from "vitest";
import {demoRestaurant} from "../src/lib/demo";
import {isMenuPublic,publicMenuRestaurant} from "../src/lib/public-menu";

describe("public menu boundaries",()=>{
  it.each(["active","trialing"])("allows a published %s restaurant",subscription_status=>{
    expect(isMenuPublic({...demoRestaurant,subscription_status})).toBe(true);
  });
  it.each([
    {access_suspended:true},
    {publication_suspended_for_payment:true},
    {is_published:false},
    {subscription_status:"past_due"},
    {subscription_status:"canceled"},
  ])("hides restricted restaurants: %j",state=>{
    expect(isMenuPublic({...demoRestaurant,subscription_status:"active",...state})).toBe(false);
  });
  it("omits owner identity, suspension details and future administrative columns from browser props",()=>{
    const result=publicMenuRestaurant({...demoRestaurant,owner_id:"private-user",suspension_reason:"private note",internal_future_field:"private",subscriptions:[{status:"active"}]} as typeof demoRestaurant);
    expect(result.name).toBe(demoRestaurant.name);
    expect(result.phone).toBe(demoRestaurant.phone);
    for(const field of ["owner_id","suspension_reason","internal_future_field","subscriptions"])
      expect(result).not.toHaveProperty(field);
  });
});
