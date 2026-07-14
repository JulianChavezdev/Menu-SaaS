import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const script=readFileSync("scripts/cleanup-orphan-media.mjs","utf8");

describe("orphan media cleanup",()=>{
  it("defaults to a dry run and deletes only unreferenced files",()=>{
    expect(script).toContain('process.argv.includes("--apply")');
    expect(script).toContain('admin.from("restaurants").select("logo_url")');
    expect(script).toContain('admin.from("products").select("video_path,image_path")');
    expect(script).toContain("allFiles.filter(file=>!referenced.has(file.path))");
    expect(script).toContain('if(!apply)');
  });
});
