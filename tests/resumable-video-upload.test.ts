import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const uploader=readFileSync("src/lib/resumable-video-upload.ts","utf8");
const component=readFileSync("src/components/dashboard/media-upload.tsx","utf8");

describe("resumable video uploads",()=>{
  it("uses Supabase TUS with bounded chunks and automatic retries",()=>{expect(uploader).toContain("/storage/v1/upload/resumable");expect(uploader).toContain("chunkSize:CHUNK_SIZE");expect(uploader).toContain("retryDelays:");expect(uploader).toContain('cacheControl:"31536000"')});
  it("shows upload progress and mobile playback recommendations",()=>{expect(component).toContain("Subida segura reanudable");expect(component).toContain("onProgress:setProgress");expect(component).toContain("MP4 vertical, H.264");expect(component).toContain("videoInfo.width>videoInfo.height")});
});
