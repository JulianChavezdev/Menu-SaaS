import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const migration=readFileSync("supabase/migrations/202607140004_storage_upload_hardening.sql","utf8");

describe("storage upload hardening",()=>{
  it("limits bucket size and MIME types",()=>{
    expect(migration).toContain("file_size_limit = 52428800");
    expect(migration).toContain("allowed_mime_types");
    expect(migration).toContain("'video/mp4'");
    expect(migration).toContain("'image/png'");
  });

  it("binds media paths to a member and product tenant",()=>{
    expect(migration).toContain("public.can_manage_restaurant_media");
    expect(migration).toContain("member.restaurant_id::text = path.folders[2]");
    expect(migration).toContain("product.id::text = path.folders[4]");
    expect(migration).toContain("product.restaurant_id = member.restaurant_id");
  });

  it("applies the helper to every write operation",()=>{
    expect(migration).toContain('create policy "member media insert"');
    expect(migration).toContain('create policy "member media update"');
    expect(migration).toContain('create policy "member media delete"');
  });
});
