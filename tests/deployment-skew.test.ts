import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const config=readFileSync("next.config.ts","utf8");

describe("deployment version skew",()=>{
  it("identifies each Vercel build so stale clients reload",()=>{
    expect(config).toContain("VERCEL_GIT_COMMIT_SHA");
    expect(config).toContain("VERCEL_DEPLOYMENT_ID");
    expect(config).toContain("deploymentId");
  });
});
