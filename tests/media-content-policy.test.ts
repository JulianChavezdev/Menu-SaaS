import {describe,expect,it} from "vitest";
import {contentSecurityPolicy} from "../src/lib/content-security-policy";

describe("menu media content policy",()=>{
  it("permits generated Cloudinary posters as images while restricting unrelated hosts",async()=>{
    const policy=contentSecurityPolicy("testnonce");
    const sources=policy.split("; ").find(directive=>directive.startsWith("img-src "))!.split(" ").slice(1);
    expect(sources).toContain("https://res.cloudinary.com");
    expect(sources).not.toContain("*");
    expect(sources).not.toContain("https:");
  });
});
