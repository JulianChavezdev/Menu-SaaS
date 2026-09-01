import {describe,expect,it} from "vitest";
import {menuVideoPlaybackUrl} from "../src/lib/menu-media";

describe("menu video playback URLs",()=>{
  it("optimizes raw Cloudinary videos for mobile playback",()=>{
    expect(menuVideoPlaybackUrl("https://res.cloudinary.com/demo/video/upload/v123/dish.mp4")).toBe("https://res.cloudinary.com/demo/video/upload/c_limit,w_720/q_auto:eco/vc_h264/f_mp4/v123/dish.mp4");
  });

  it("does not duplicate an existing Cloudinary transformation",()=>{
    const source="https://res.cloudinary.com/demo/video/upload/c_limit,w_720/q_auto:eco/vc_h264/f_mp4/v123/dish.mp4";
    expect(menuVideoPlaybackUrl(source)).toBe(source);
  });

  it("leaves non-Cloudinary sources unchanged",()=>{
    const source="https://videos.pexels.com/video-files/1/dish.mp4";
    expect(menuVideoPlaybackUrl(source)).toBe(source);
  });
});
