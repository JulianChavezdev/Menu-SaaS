import { describe, expect, it } from "vitest";
import {
  DEFAULT_MENU_TEMPLATE,
  isMenuTemplateKey,
  MENU_TEMPLATES,
  resolveMenuTemplate,
} from "../src/lib/menu-templates";

describe("menu templates", () => {
  it("resolves Cinemática as the principal template", () => {
    expect(resolveMenuTemplate("cinematic").key).toBe("cinematic");
  });
  it("resolves NoirLuxe for paid restaurants", () => {
    expect(resolveMenuTemplate("noirluxe", true).key).toBe("noirluxe");
  });
  it("falls back from NoirLuxe without a premium plan", () => {
    expect(resolveMenuTemplate("noirluxe", false).key).toBe(
      DEFAULT_MENU_TEMPLATE,
    );
  });
  it("falls back when a stored key is unknown", () => {
    expect(resolveMenuTemplate("removed-template").key).toBe(
      DEFAULT_MENU_TEMPLATE,
    );
  });
  it("validates the five current templates", () => {
    expect(isMenuTemplateKey("cinematic")).toBe(true);
    expect(isMenuTemplateKey("noirluxe")).toBe(true);
    expect(isMenuTemplateKey("street")).toBe(true);
    expect(isMenuTemplateKey("cozy-corner")).toBe(true);
    expect(isMenuTemplateKey("tokyo-pulse")).toBe(true);
    expect(isMenuTemplateKey("midnight")).toBe(false);
  });
  it("keeps one free and four premium templates", () => {
    const templates = Object.values(MENU_TEMPLATES);
    expect(templates).toHaveLength(5);
    expect(templates.filter((item) => item.tier === "free")).toHaveLength(1);
    expect(templates.filter((item) => item.tier === "premium")).toHaveLength(4);
    expect(MENU_TEMPLATES.noirluxe).toMatchObject({
      name: "NoirLuxe",
      tier: "premium",
      motif: "noirluxe",
    });
    expect(MENU_TEMPLATES.street).toMatchObject({
      name: "Street",
      tier: "premium",
      motif: "street",
    });
    expect(MENU_TEMPLATES["cozy-corner"]).toMatchObject({
      name: "Cozy Corner",
      tier: "premium",
      motif: "cozy-corner",
    });
    expect(MENU_TEMPLATES["tokyo-pulse"]).toMatchObject({
      name: "Tokyo Pulse",
      tier: "premium",
      motif: "tokyo-pulse",
    });
  });
});
