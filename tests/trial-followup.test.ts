import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const page=readFileSync("src/app/superadmin/page.tsx","utf8");
const action=readFileSync("src/app/superadmin/actions.ts","utf8");
const inbox=readFileSync("src/components/superadmin/trial-followup-inbox.tsx","utf8");

describe("trial followup",()=>{
  it("loads active trials and their latest audited contact",()=>{expect(page).toContain('eq("action","trial.reminder_prepared")');expect(page).toContain("TrialFollowupInbox")});
  it("records preparation without sending automatically",()=>{expect(action).toContain('"trial.reminder_prepared"');expect(inbox).toContain("nunca enviará el mensaje automáticamente")});
  it("moves the first prepared contact to contacted",()=>{expect(action).toContain('current.stage==="new"');expect(action).toContain('stage:"contacted"')});
  it("offers copy, whatsapp, email and restaurant management",()=>{for(const copy of["Copiar","WhatsApp","Correo","Gestionar"])expect(inbox).toContain(copy)});
});
