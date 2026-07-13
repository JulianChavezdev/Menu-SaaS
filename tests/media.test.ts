import {describe,expect,it} from "vitest";
import {isValidMediaPath} from "../src/lib/media";

const restaurantId="123e4567-e89b-42d3-a456-426614174000";
const productId="223e4567-e89b-42d3-a456-426614174000";
const fileId="323e4567-e89b-42d3-a456-426614174000";

describe("media paths",()=>{
  it("accepts tenant-scoped logos and product videos",()=>{
    expect(isValidMediaPath({kind:"logo",restaurantId,path:`restaurants/${restaurantId}/branding/logo-${fileId}.png`})).toBe(true);
    expect(isValidMediaPath({kind:"product-video",restaurantId,productId,path:`restaurants/${restaurantId}/products/${productId}/video-${fileId}.mp4`})).toBe(true);
  });

  it("rejects other tenants, unsupported types and mismatched products",()=>{
    expect(isValidMediaPath({kind:"logo",restaurantId,path:`restaurants/${crypto.randomUUID()}/branding/logo-${fileId}.png`})).toBe(false);
    expect(isValidMediaPath({kind:"logo",restaurantId,path:`restaurants/${restaurantId}/branding/logo-${fileId}.svg`})).toBe(false);
    expect(isValidMediaPath({kind:"product-video",restaurantId,productId,path:`restaurants/${restaurantId}/products/${crypto.randomUUID()}/video-${fileId}.mp4`})).toBe(false);
  });
});
