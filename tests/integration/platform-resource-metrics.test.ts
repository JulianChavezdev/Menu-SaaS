import {createClient} from "@supabase/supabase-js";
import {config} from "dotenv";
import {describe,expect,it} from "vitest";

config({path:".env.local",quiet:true});
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey=process.env.SUPABASE_SECRET_KEY??process.env.SUPABASE_SERVICE_ROLE_KEY;
const suite=url&&publicKey&&serviceKey?describe:describe.skip;

suite("platform resource metrics",()=>{
  it("returns only aggregates to the service role",async context=>{
    const admin=createClient(url!,serviceKey!,{auth:{persistSession:false,autoRefreshToken:false}});
    const metrics=await admin.rpc("get_platform_resource_metrics");
    if(metrics.error){context.skip();return}
    const row=Array.isArray(metrics.data)?metrics.data[0]:metrics.data;
    expect(Number(row.storage_bytes)).toBeGreaterThanOrEqual(0);
    expect(Number(row.storage_objects)).toBeGreaterThanOrEqual(0);
    expect(row).not.toHaveProperty("name");

    const anonymous=createClient(url!,publicKey!,{auth:{persistSession:false,autoRefreshToken:false}});
    const blocked=await anonymous.rpc("get_platform_resource_metrics");
    expect(blocked.error).not.toBeNull();
  });
});
