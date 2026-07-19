import{describe,expect,it}from"vitest";
import{isValidPublicSlug,normalizePublicSlug}from"../src/lib/public-slug";

describe("slug público",()=>{
  it("normaliza el nombre para una URL estable",()=>expect(normalizePublicSlug("  Café El Rincón  ")).toBe("cafe-el-rincon"));
  it("elimina símbolos y guiones sobrantes",()=>expect(normalizePublicSlug("--Mi  Carta!!!")).toBe("mi-carta"));
  it("valida longitud y formato",()=>{expect(isValidPublicSlug("mi-restaurante")).toBe(true);expect(isValidPublicSlug("no válido")).toBe(false);expect(isValidPublicSlug("ab")).toBe(false)});
});
