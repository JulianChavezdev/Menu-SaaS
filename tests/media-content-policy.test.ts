import {describe,expect,it} from "vitest";
import config from "../next.config";

describe("menu media content policy",()=>{
  it("permits generated Cloudinary posters as images while restricting unrelated hosts",async()=>{
    const headers=await config.headers!();
    const policy=headers.find(rule=>rule.source==="/:path*")!.headers.find(header=>header.key==="Content-Security-Policy")!.value;
    const sources=policy.split("; ").find(directive=>directive.startsWith("img-src "))!.split(" ").slice(1);
    expect(sources).toContain("https://res.cloudinary.com");
    expect(sources).not.toContain("*");
    expect(sources).not.toContain("https:");
  });
});
