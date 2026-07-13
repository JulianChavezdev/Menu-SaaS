import {describe,expect,it} from "vitest";
import {normalizedAppUrl} from "../src/lib/app-url";

describe("application URL",()=>{
  it("normalizes a trailing slash",()=>expect(normalizedAppUrl("https://carta.example/")).toBe("https://carta.example"));
  it("falls back safely for invalid values",()=>expect(normalizedAppUrl("not a url")).toBe("http://localhost:3000"));
});
