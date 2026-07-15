import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {ALLERGEN_CODES,ALLERGENS,allergenLabel} from "../src/lib/allergens";

const migration=readFileSync("supabase/migrations/202607150002_product_allergens.sql","utf8");
const manager=readFileSync("src/components/dashboard/products-manager.tsx","utf8");
const menu=readFileSync("src/components/menu/video-menu.tsx","utf8");

describe("product allergens",()=>{
  it("supports the 14 Annex II allergen groups in Spanish and English",()=>{
    expect(ALLERGEN_CODES).toHaveLength(14);
    expect(new Set(ALLERGEN_CODES).size).toBe(14);
    for(const code of ALLERGEN_CODES){expect(ALLERGENS[code].es).toBeTruthy();expect(ALLERGENS[code].en).toBeTruthy()}
    expect(allergenLabel("milk","es")).toBe("Leche");
  });

  it("persists only canonical codes and restores them from backups",()=>{
    expect(migration).toContain("add column if not exists allergens text[]");
    expect(migration).toContain("products_allergens_allowed");
    expect(migration).toContain("allergens text[]");
    for(const code of ALLERGEN_CODES)expect(migration).toContain(`'${code}'`);
  });

  it("lets restaurants edit allergens and customers open their tab",()=>{
    expect(manager).toContain('name="allergens"');
    expect(manager).toContain("Marca todos los que contiene el plato");
    expect(menu).toContain("allergenNotice");
    expect(menu).toContain("allergenLabel(code,language)");
  });

  it("offers a categorized two-column menu with media thumbnails",()=>{
    expect(menu).toContain("categoryGroups");
    expect(menu).toContain("grid grid-cols-2 gap-3");
    expect(menu).toContain('preload="metadata"');
    expect(menu).toContain("text.listHint");
  });
});
