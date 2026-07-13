import {afterEach,describe,expect,it} from "vitest";
import {isSuperadminUser} from "../src/lib/superadmin-identity";

const previousIds=process.env.SUPERADMIN_USER_IDS;
const previousEmails=process.env.SUPERADMIN_EMAILS;
afterEach(()=>{process.env.SUPERADMIN_USER_IDS=previousIds;process.env.SUPERADMIN_EMAILS=previousEmails});

describe("superadmin allowlist",()=>{
  it("allows configured ids or emails",()=>{process.env.SUPERADMIN_USER_IDS="abc, def";process.env.SUPERADMIN_EMAILS="OWNER@example.com";expect(isSuperadminUser({id:"abc"})).toBe(true);expect(isSuperadminUser({id:"other",email:"owner@example.com"})).toBe(true)});
  it("denies every user when the allowlist is empty",()=>{delete process.env.SUPERADMIN_USER_IDS;delete process.env.SUPERADMIN_EMAILS;expect(isSuperadminUser({id:"abc",email:"owner@example.com"})).toBe(false)});
});
