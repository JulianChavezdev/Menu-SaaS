import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const migration=readFileSync("supabase/migrations/202607130004_security_hardening.sql","utf8");
const trialMigration=readFileSync("supabase/migrations/202607190001_trial_one_product_per_category_and_expiration_trash.sql","utf8");

describe("security hardening migration",()=>{
  it("requires a published restaurant for public categories and products",()=>{
    expect(migration).toContain("is_published_restaurant(restaurant_id)");
    expect(migration).toContain("is_public_category(category_id, restaurant_id)");
  });

  it("removes direct membership creation by restaurant members",()=>{
    expect(migration).toContain('drop policy if exists "owner add members"');
  });

  it("protects billing ownership and cross-tenant category links",()=>{
    expect(migration).toContain("protect_restaurant_system_fields");
    expect(migration).toContain("enforce_product_category_tenant");
    expect(migration).toContain("new.subscription_status is distinct from old.subscription_status");
  });

  it("enforces trial limits in the database with serialized inserts",()=>{
    expect(trialMigration).toContain("enforce_trial_plan_limits");
    expect(trialMigration).toContain("pg_advisory_xact_lock");
    expect(trialMigration).toContain("category_count >= 1");
    expect(trialMigration).toContain("current_count >= 5");
    expect(trialMigration).toContain("tg_op = 'INSERT' or new.restaurant_id is distinct from old.restaurant_id");
    expect(trialMigration).toContain("if tg_table_name = 'categories' then");
    expect(trialMigration).toContain("elsif tg_table_name = 'products'");
    expect(trialMigration).toContain("trial_policy_version");
  });
});
