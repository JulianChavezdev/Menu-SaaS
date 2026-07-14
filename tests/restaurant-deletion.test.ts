import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {matchesRestaurantDeletion,restaurantDeletionPhrase} from "../src/lib/restaurant-deletion";

describe("eliminación protegida de restaurantes",()=>{
  it("exige correo, frase exacta y aceptación",()=>{
    expect(restaurantDeletionPhrase("illegal-food")).toBe("ELIMINAR illegal-food");
    const base={slug:"illegal-food",typedPhrase:"ELIMINAR illegal-food",expectedEmail:"Admin@Example.com",typedEmail:"admin@example.com",acknowledged:true};
    expect(matchesRestaurantDeletion(base)).toBe(true);
    expect(matchesRestaurantDeletion({...base,typedPhrase:"ELIMINAR"})).toBe(false);
    expect(matchesRestaurantDeletion({...base,typedEmail:"other@example.com"})).toBe(false);
    expect(matchesRestaurantDeletion({...base,acknowledged:false})).toBe(false);
  });

  it("valida de nuevo en el servidor, conserva una copia y limita la limpieza al restaurante",()=>{
    const action=readFileSync("src/app/superadmin/actions.ts","utf8");
    expect(action).toContain("requireSuperadmin()");
    expect(action).toContain("matchesRestaurantDeletion");
    expect(action).toContain("restaurant.deletion_backup_created");
    expect(action.indexOf("restaurant.deletion_backup_created")).toBeLessThan(action.indexOf('from("restaurants").delete()'));
    expect(action).toContain("path.startsWith(prefix)");
    expect(action).toContain("memberships:memberships??[]");
    expect(action).toContain("media_files_retained");
    expect(action).not.toContain('storage.from("restaurant-media").remove');
  });
});
