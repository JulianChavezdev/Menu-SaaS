import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const script=readFileSync("scripts/check-deployment.mjs","utf8");
const packageJson=JSON.parse(readFileSync("package.json","utf8")) as {scripts:Record<string,string>};

describe("post-deployment checks",()=>{
  it("covers public routes, health and security headers",()=>{
    expect(packageJson.scripts["check:deployment"]).toContain("check-deployment.mjs");
    expect(packageJson.scripts["check:production"]).toContain("--require-features");
    expect(script).toContain('path:"/api/health"');
    expect(script).toContain('path:"/r/bistro-nube"');
    expect(script).toContain('path:"/manifest.webmanifest"');
    expect(script).toContain('"content-security-policy"');
    expect(script).toContain('"x-content-type-options"');
    expect(script).toContain("AbortSignal.timeout(10_000)");
    expect(script).toContain("features.automatic_translation");
    expect(script).toContain("features.scheduled_maintenance");
  });
});
