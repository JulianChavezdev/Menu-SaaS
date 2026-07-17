import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {restaurantOnboarding} from "../src/lib/onboarding";

const migration=readFileSync("supabase/migrations/202607170002_sales_growth.sql","utf8");
const menu=readFileSync("src/components/menu/video-menu.tsx","utf8");
const manager=readFileSync("src/components/dashboard/products-manager.tsx","utf8");
const analytics=readFileSync("src/app/dashboard/analytics/page.tsx","utf8");

describe("sales growth features",()=>{
  it("keeps recommendations tenant-safe",()=>{
    expect(migration).toContain("product_recommendations_different_products");
    expect(migration).toContain("Recommended products must belong to the same restaurant");
    expect(migration).toContain("public.can_edit(restaurant_id)");
  });

  it("limits contextual recommendations and tracks attributed additions",()=>{
    expect(manager).toContain("Máximo 3 recomendaciones");
    expect(menu).toContain('event:"recommendation_add"');
    expect(menu).toContain('event:"detail_open"');
    expect(menu).toContain("Combina bien con");
  });

  it("shows intent metrics without calling them confirmed sales",()=>{
    expect(analytics).toContain("Intención de compra");
    expect(analytics).toContain("no ventas confirmadas");
    expect(analytics).toContain("Tasa de añadido");
    expect(analytics).toContain("Oportunidad detectada");
  });

  it("guides restaurants to the next incomplete setup step",()=>{
    const start=restaurantOnboarding({hasLogo:false,hasContact:false,categories:4,products:0,media:0,published:false});
    expect(start).toMatchObject({completed:0,total:5,percentage:0,complete:false});
    expect(start.next?.id).toBe("identity");
    const complete=restaurantOnboarding({hasLogo:true,hasContact:true,categories:4,products:2,media:2,published:true});
    expect(complete).toMatchObject({completed:5,percentage:100,complete:true,next:null});
  });
});
