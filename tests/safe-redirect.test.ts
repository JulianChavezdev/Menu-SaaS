import {describe,expect,it} from "vitest";
import {safeRedirectPath} from "../src/lib/safe-redirect";

describe("safe redirects",()=>{
  it("allows local application paths",()=>expect(safeRedirectPath("/reset-password")).toBe("/reset-password"));
  it.each(["https://evil.example","//evil.example","/\\evil.example",null])("rejects unsafe destinations",value=>{
    expect(safeRedirectPath(value)).toBe("/dashboard");
  });
});
