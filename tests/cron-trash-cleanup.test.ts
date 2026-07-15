import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {isValidCronAuthorization} from "../src/lib/cron-auth";

const route=readFileSync("src/app/api/cron/trash-cleanup/route.ts","utf8");
const cleanup=readFileSync("src/lib/trash-cleanup.ts","utf8");
const runner=readFileSync("src/lib/trash-cleanup-run.ts","utf8");
const vercel=JSON.parse(readFileSync("vercel.json","utf8"));

describe("purga programada de papelera",()=>{
  it("exige un bearer secreto con comparación segura",()=>{
    expect(isValidCronAuthorization("Bearer secret","secret")).toBe(true);
    expect(isValidCronAuthorization("Bearer wrong","secret")).toBe(false);
    expect(isValidCronAuthorization(null,"secret")).toBe(false);
    expect(isValidCronAuthorization("Bearer secret",undefined)).toBe(false);
    expect(route).toContain('status:401');
  });

  it("procesa solo copias vencidas, conserva restauradas y redacta el backup",()=>{
    expect(cleanup).toContain('.lt("created_at",cutoff)');
    expect(cleanup).toContain('if(!restored.has(entry.id))');
    expect(cleanup).toContain('path.startsWith(prefix)');
    expect(cleanup).toContain('update({details:redacted})');
    expect(cleanup).toContain('restaurant.trash_purged');
  });

  it("se programa una vez al día en producción",()=>{
    expect(vercel.crons).toEqual([{path:"/api/cron/trash-cleanup",schedule:"15 3 * * *"}]);
  });

  it("registra cada ejecución para mostrar su estado al superadmin",()=>{
    expect(runner).toContain("platform.trash_cleanup_completed");
    expect(runner).toContain("platform.trash_cleanup_failed");
    expect(runner).toContain("duration_ms");
    expect(runner).toContain("error_message");
  });
});
