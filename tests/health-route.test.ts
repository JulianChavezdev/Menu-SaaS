import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const route=readFileSync("src/app/api/health/route.ts","utf8");

describe("health endpoint",()=>{
  it("never caches its result or exposes credentials",()=>{
    expect(route).toContain('"Cache-Control":"no-store"');
    expect(route).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(route).toContain("automatic_translation:Boolean(process.env.DEEPL_API_KEY)");
  });

  it("bounds the database probe",()=>{
    expect(route).toContain("DATABASE_TIMEOUT_MS=3_000");
    expect(route).toContain("new AbortController()");
    expect(route).toContain(".abortSignal(controller.signal)");
    expect(route).toContain("clearTimeout(timeout)");
  });
});
