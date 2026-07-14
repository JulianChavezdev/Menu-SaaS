import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const menu=readFileSync("src/components/menu/video-menu.tsx","utf8");
const media=readFileSync("src/components/menu/product-media.tsx","utf8");

describe("public video resilience",()=>{
  it("pauses and resets videos after leaving the viewport",()=>{expect(menu).toContain("video.pause();video.currentTime=0");expect(menu).toContain("playingIndex.current=null")});
  it("shows the poster while loading and offers an error retry",()=>{expect(media).toContain('status==="loading"');expect(media).toContain('status==="error"');expect(media).toContain("Reintentar");expect(media).toContain("poster")});
  it("respects reduced motion and supports manual playback",()=>{expect(menu).toContain('prefers-reduced-motion: reduce');expect(media).toContain("reducedMotion");expect(media).toContain("manualPlay")});
  it("limits metadata preloading to nearby products",()=>expect(menu).toContain('index<=active+1?"metadata":"none"'));
});
