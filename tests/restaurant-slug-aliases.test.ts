import{readFileSync}from"node:fs";
import{describe,expect,it}from"vitest";

const migration=readFileSync("supabase/migrations/202607190002_restaurant_slug_aliases.sql","utf8");
const publicMenu=readFileSync("src/app/r/[slug]/page.tsx","utf8");

describe("historial de URL pública",()=>{
  it("reserva slugs anteriores automáticamente",()=>{expect(migration).toContain("restaurant_slug_aliases");expect(migration).toContain("maintain_restaurant_slug_aliases");expect(migration).toContain("before insert or update of slug")});
  it("redirige una URL antigua a la carta vigente",()=>{expect(publicMenu).toContain('from("restaurant_slug_aliases")');expect(publicMenu).toContain("permanentRedirect");expect(publicMenu).toContain('restaurants(slug)')});
});
