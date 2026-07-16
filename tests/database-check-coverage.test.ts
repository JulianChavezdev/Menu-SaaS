import {readdirSync,readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const checker=readFileSync("scripts/check-db.mjs","utf8");
const migrations=readdirSync("supabase/migrations").filter(name=>name!=="202607100001_initial_schema.sql");

describe("remote database checker",()=>{
  it("covers every incremental migration",()=>{
    for(const migration of migrations)expect(checker,`${migration} is not checked`).toContain(migration);
  });

  it("checks allergens and payment publication suspension",()=>{
    expect(checker).toContain('select("allergens"');
    expect(checker).toContain('select("publication_suspended_for_payment"');
  });
});
