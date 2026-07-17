import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const menu=readFileSync("src/components/menu/video-menu.tsx","utf8");
const media=readFileSync("src/components/menu/product-media.tsx","utf8");

describe("public video resilience",()=>{
  it("pauses and safely resets videos after leaving the viewport",()=>{expect(menu).toContain("safelyRewind(video)");expect(menu).toContain("HAVE_METADATA");expect(menu).toContain("playingIndex.current=null")});
  it("shows the poster while loading and offers recovery for slow or failed media",()=>{expect(media).toContain('status==="loading"');expect(media).toContain('status==="error"');expect(media).toContain("Reanudar vídeo");expect(media).toContain("Reintentar");expect(media).toContain("onStalled");expect(media).toContain("poster")});
  it("keeps essential menu videos active and supports manual fallback",()=>{expect(media).toContain("autoPlay={active}");expect(media).toContain('setAttribute("webkit-playsinline","true")');expect(media).toContain("manualPlay");expect(media).not.toContain("reducedMotion")});
  it("destroys players outside the active three-item window",()=>{expect(menu).toContain("hydrated={Math.abs(index-active)<=1}");expect(media).toContain("src&&hydrated&&<video")});
  it("recovers when Safari loads media before React attaches events",()=>{expect(media).toContain("video.readyState>=HTMLMediaElement.HAVE_CURRENT_DATA");expect(media).toContain('status==="error"?"opacity-0":"opacity-100"');expect(menu).toContain("onPointerUp={resumeActiveVideo}")});
});
