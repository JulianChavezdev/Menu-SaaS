import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const sql=readFileSync("supabase/migrations/202607140005_platform_resource_metrics.sql","utf8");

describe("platform resource metrics migration",()=>{
  it("aggregates media sizes without exposing object paths",()=>{
    expect(sql).toContain("get_platform_resource_metrics");
    expect(sql).toContain("sum(bytes)");
    expect(sql).toContain("storage.foldername(object.name)");
    expect(sql).not.toContain("returns setof storage.objects");
  });

  it("is callable only by the backend service role",()=>{
    expect(sql).toContain("security definer");
    expect(sql).toContain("revoke all on function public.get_platform_resource_metrics() from public, anon, authenticated");
    expect(sql).toContain("grant execute on function public.get_platform_resource_metrics() to service_role");
  });
});
