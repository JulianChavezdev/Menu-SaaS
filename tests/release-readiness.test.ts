import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const envCheck=readFileSync("scripts/check-env.mjs","utf8");
const packageJson=JSON.parse(readFileSync("package.json","utf8")) as {scripts:Record<string,string>};
const layout=readFileSync("src/app/layout.tsx","utf8");
const mediaCheck=readFileSync("scripts/check-showcase-media.mjs","utf8");
const dashboardLayout=readFileSync("src/app/dashboard/layout.tsx","utf8");
const authLayout=readFileSync("src/app/(auth)/layout.tsx","utf8");
const nextConfig=readFileSync("next.config.ts","utf8");

describe("release readiness",()=>{
  it("requires production HTTPS and a superadmin allowlist",()=>{
    expect(envCheck).toContain('process.argv.includes("--production")');
    expect(envCheck).toContain('appUrl.protocol!=="https:"');
    expect(envCheck).toContain("SUPERADMIN_USER_IDS");
    expect(packageJson.scripts["check:release"]).toContain("--production");
  });

  it("supports current Supabase keys and legacy aliases",()=>{
    expect(envCheck).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    expect(envCheck).toContain("SUPABASE_SECRET_KEY");
    expect(envCheck).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    expect(envCheck).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("validates the configurable restaurant capacity",()=>{
    expect(envCheck).toContain("SUPERADMIN_RESTAURANT_CAPACITY");
    expect(envCheck).toContain("capacity>100_000");
  });

  it("validates the configured Storage capacity",()=>{
    expect(envCheck).toContain("SUPERADMIN_STORAGE_CAPACITY_GB");
    expect(envCheck).toContain("storageCapacity>1_000_000");
  });

  it("rejects partially configured Stripe",()=>{
    expect(envCheck).toContain("La configuración de Stripe está incompleta");
  });

  it("checks remote demo media before release",()=>{
    expect(packageJson.scripts["check:media"]).toContain("check-showcase-media.mjs");
    expect(packageJson.scripts["check:release"]).toContain("check-showcase-media.mjs");
    expect(mediaCheck).toContain('method:"HEAD"');
    expect(mediaCheck).toContain("15*1024*1024");
  });

  it("publishes canonical and social metadata",()=>{
    expect(layout).toContain('alternates:{canonical:"/"}');
    expect(layout).toContain('twitter:{card:"summary"');
    expect(layout).toContain('rel="preconnect"');
  });

  it("keeps private and authentication routes out of search results",()=>{
    expect(dashboardLayout).toContain("index:false,follow:false");
    expect(authLayout).toContain("index:false,follow:false");
  });

  it("restricts executable and embedded content",()=>{
    expect(nextConfig).toContain('"Content-Security-Policy"');
    expect(nextConfig).toContain("object-src 'none'");
    expect(nextConfig).toContain("frame-ancestors 'self'");
    expect(nextConfig).toContain("https://videos.pexels.com");
  });
});
