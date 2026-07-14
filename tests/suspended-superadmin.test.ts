import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const permissions=readFileSync("src/lib/permissions.ts","utf8");
const suspended=readFileSync("src/app/suspended/page.tsx","utf8");

describe("acceso del superadmin con un restaurante suspendido",()=>{
  it("envía al superadmin a su panel sin reactivar el restaurante",()=>{
    expect(permissions).toContain('redirect(isSuperadminUser(user)?"/superadmin":"/suspended")');
    expect(suspended).toContain('if(isSuperadminUser(user))redirect("/superadmin")');
    expect(permissions).not.toContain("access_suspended:false");
  });
});
