import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {isRestaurantTrashRestorable,restaurantRestoreDeadline,RESTAURANT_RESTORE_DAYS} from "../src/lib/restaurant-trash";

describe("papelera de restaurantes",()=>{
  it("ofrece una ventana exacta de 30 días",()=>{
    const deleted=new Date("2026-07-01T12:00:00.000Z");
    expect(RESTAURANT_RESTORE_DAYS).toBe(30);
    expect(restaurantRestoreDeadline(deleted).toISOString()).toBe("2026-07-31T12:00:00.000Z");
    expect(isRestaurantTrashRestorable(deleted,new Date("2026-07-31T11:59:59.000Z"))).toBe(true);
    expect(isRestaurantTrashRestorable(deleted,new Date("2026-07-31T12:00:00.000Z"))).toBe(false);
  });

  it("restaura desde una copia validada y mantiene el restaurante bloqueado",()=>{
    const action=readFileSync("src/app/superadmin/actions.ts","utf8");
    const page=readFileSync("src/app/superadmin/trash/page.tsx","utf8");
    expect(action).toContain("deletedRestaurantBackup.safeParse");
    expect(action).toContain('is_published:false');
    expect(action).toContain('access_suspended:true');
    expect(action).toContain('subscription_status:"canceled"');
    expect(action).toContain("if(created)await admin.from");
    expect(page).toContain("Restaurar suspendido");
    expect(page).toContain("isRestaurantTrashRestorable");
  });
});
