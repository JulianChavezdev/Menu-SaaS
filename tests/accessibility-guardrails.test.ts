import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const menu=readFileSync("src/components/menu/video-menu.tsx","utf8");
const landingVideo=readFileSync("src/components/marketing/landing-preview-video.tsx","utf8");
const login=readFileSync("src/app/(auth)/login/page.tsx","utf8");
const register=readFileSync("src/app/(auth)/register/page.tsx","utf8");

describe("accessibility guardrails",()=>{
  it("uses one restaurant heading and product subheadings",()=>{
    expect(menu).toContain('<h1 className="sr-only">');
    expect(menu).toContain("<h2 className=");
    expect(menu).toContain("document.documentElement.lang=language");
  });

  it("respects reduced motion on the landing video",()=>{
    expect(landingVideo).toContain('matchMedia("(prefers-reduced-motion: reduce)")');
    expect(landingVideo).toContain("video.pause()");
    expect(landingVideo).not.toContain("autoPlay");
  });

  it("provides password autocomplete and submission state",()=>{
    expect(login).toContain('autoComplete="current-password"');
    expect(register).toContain('autoComplete="new-password"');
    expect(login).toContain("aria-busy={pending}");
    expect(register).toContain("aria-busy={pending}");
  });
});
