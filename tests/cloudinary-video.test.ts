import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const route=readFileSync("src/app/api/media/cloudinary-signature/route.ts","utf8");
const cloudinary=readFileSync("src/lib/cloudinary.ts","utf8");
const upload=readFileSync("src/lib/cloudinary-video-upload.ts","utf8");
const actions=readFileSync("src/app/dashboard/actions.ts","utf8");

describe("Cloudinary optimized videos",()=>{
  it("signs uploads only for authenticated restaurant products",()=>{expect(route).toContain('new URL(origin).origin!==new URL(request.url).origin');expect(route).toContain('supabase.auth.getUser()');expect(route).toContain('from("restaurant_members")');expect(route).toContain('from("products")');expect(route).toContain("api_sign_request")});
  it("delivers mobile-compatible optimized MP4 and cleans replaced assets",()=>{for(const token of ['width:720','quality:"auto:eco"','video_codec:"h264"','fetch_format:"mp4"'])expect(cloudinary).toContain(token);expect(actions).toContain("destroyCloudinaryVideo");expect(actions).toContain("assignCloudinaryVideo")});
  it("generates a list poster unless the restaurant uploaded a custom photo",()=>{expect(cloudinary).toContain("cloudinaryVideoPosterUrl");expect(cloudinary).toContain('format:"jpg"');expect(actions).toContain('select("video_path,image_path")');expect(actions).toContain('previous.image_path?{}:{image_url:cloudinaryVideoPosterUrl(publicId)}')});
  it("uploads directly from the browser and falls back only when unconfigured",()=>{expect(upload).toContain("api.cloudinary.com");expect(upload).toContain("CloudinaryUnavailableError");expect(upload).toContain("xhr.upload.onprogress")});
});
