import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const table=readFileSync("src/components/superadmin/restaurants-table.tsx","utf8");
const preview=readFileSync("src/app/superadmin-preview/[id]/page.tsx","utf8");

describe("vista previa de carta para superadmin",()=>{
  it("muestra el acceso directo junto a gestionar",()=>{
    expect(table).toContain("Ver carta");
    expect(table).toContain("/superadmin-preview/${item.id}");
    expect(table).toContain('target="_blank"');
  });

  it("protege la vista, usa el cliente administrativo y no registra analíticas",()=>{
    expect(preview).toContain("requireSuperadmin()");
    expect(preview).toContain('admin.from("restaurants")');
    expect(preview).toContain("analyticsEnabled={false}");
  });
});
