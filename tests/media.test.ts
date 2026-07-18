import { describe, expect, it } from "vitest";
import {
  isAutomaticPosterPath,
  isValidMediaPath,
  storagePathFromPublicUrl,
} from "../src/lib/media";

const restaurantId = "123e4567-e89b-42d3-a456-426614174000";
const productId = "223e4567-e89b-42d3-a456-426614174000";
const fileId = "323e4567-e89b-42d3-a456-426614174000";

describe("media paths", () => {
  it("accepts tenant-scoped logos, product photos and videos", () => {
    expect(
      isValidMediaPath({
        kind: "logo",
        restaurantId,
        path: `restaurants/${restaurantId}/branding/logo-${fileId}.png`,
      }),
    ).toBe(true);
    expect(
      isValidMediaPath({
        kind: "product-video",
        restaurantId,
        productId,
        path: `restaurants/${restaurantId}/products/${productId}/video-${fileId}.mp4`,
      }),
    ).toBe(true);
    expect(
      isValidMediaPath({
        kind: "product-video",
        restaurantId,
        productId,
        path: `restaurants/${restaurantId}/products/${productId}/video-${fileId}.mov`,
      }),
    ).toBe(true);
    expect(
      isValidMediaPath({
        kind: "product-image",
        restaurantId,
        productId,
        path: `restaurants/${restaurantId}/products/${productId}/image-${fileId}.webp`,
      }),
    ).toBe(true);
    const poster = `restaurants/${restaurantId}/products/${productId}/image-auto-${fileId}.jpg`;
    expect(
      isValidMediaPath({
        kind: "product-image",
        restaurantId,
        productId,
        path: poster,
      }),
    ).toBe(true);
    expect(isAutomaticPosterPath(poster)).toBe(true);
  });

  it("rejects other tenants, unsupported types and mismatched products", () => {
    expect(
      isValidMediaPath({
        kind: "logo",
        restaurantId,
        path: `restaurants/${crypto.randomUUID()}/branding/logo-${fileId}.png`,
      }),
    ).toBe(false);
    expect(
      isValidMediaPath({
        kind: "logo",
        restaurantId,
        path: `restaurants/${restaurantId}/branding/logo-${fileId}.svg`,
      }),
    ).toBe(false);
    expect(
      isValidMediaPath({
        kind: "product-video",
        restaurantId,
        productId,
        path: `restaurants/${restaurantId}/products/${crypto.randomUUID()}/video-${fileId}.mp4`,
      }),
    ).toBe(false);
    expect(
      isValidMediaPath({
        kind: "product-image",
        restaurantId,
        productId,
        path: `restaurants/${restaurantId}/products/${crypto.randomUUID()}/image-${fileId}.jpg`,
      }),
    ).toBe(false);
  });

  it("recovers only safe Storage paths from public URLs", () => {
    const path = `restaurants/${restaurantId}/branding/logo-${fileId}.png`;
    expect(
      storagePathFromPublicUrl(
        `https://project.supabase.co/storage/v1/object/public/restaurant-media/${path}`,
        "restaurant-media",
      ),
    ).toBe(path);
    expect(
      storagePathFromPublicUrl("/demo/logos/local.svg", "restaurant-media"),
    ).toBeNull();
    expect(
      storagePathFromPublicUrl(
        "https://example.com/storage/v1/object/public/other/file.png",
        "restaurant-media",
      ),
    ).toBeNull();
  });
});
