import {describe,expect,it} from "vitest";
import {buildRestorePreview,parseRestaurantBackup,RestoreValidationError} from "../src/lib/restaurant-restore";

const restaurantId="11111111-1111-4111-8111-111111111111";
const categoryId="22222222-2222-4222-8222-222222222222";
const productId="33333333-3333-4333-8333-333333333333";
const backup={
  format:"carta-video.restaurant-backup",version:1,exportedAt:"2026-07-14T12:00:00.000Z",mediaFilesIncluded:false,
  restaurant:{id:restaurantId,name:"Restaurado",slug:"origen",description:null,logo_url:"https://example.com/logo.png",phone:null,email:null,address:null,instagram_url:null,website_url:null,currency:"EUR",locale:"es-ES",timezone:"Europe/Madrid",is_published:true,language_switcher_enabled:false,menu_template:"cinematic",translations:{}},
  categories:[{id:categoryId,restaurant_id:restaurantId,name:"Postres",slug:"postres",sort_order:0,is_active:true,translations:{}}],
  products:[{id:productId,restaurant_id:restaurantId,category_id:categoryId,name:"Tarta",description:null,price_cents:650,video_url:"https://example.com/video.mp4",video_path:null,image_url:null,image_path:null,is_available:true,is_featured:false,sort_order:0,translations:{}}],
} as const;

const current={name:"Actual",description:null,logo_url:null,phone:null,email:null,address:null,instagram_url:null,website_url:null,currency:"EUR",locale:"es-ES",timezone:"Europe/Madrid",is_published:false,language_switcher_enabled:false,menu_template:"cinematic",subscription_status:"active"};

describe("restaurant backup restore",()=>{
  it("accepts a versioned backup for its original restaurant and strips unrelated domains",()=>{
    const parsed=parseRestaurantBackup({...backup,members:[{role:"owner"}],restaurant:{...backup.restaurant,owner_id:"attacker"}},restaurantId);
    expect(parsed.restaurant).not.toHaveProperty("owner_id");
    expect(parsed).not.toHaveProperty("members");
    expect(parsed.products[0].allergens).toEqual([]);
  });

  it("rejects cross-restaurant and broken category references",()=>{
    expect(()=>parseRestaurantBackup(backup,"44444444-4444-4444-8444-444444444444")).toThrow(RestoreValidationError);
    expect(()=>parseRestaurantBackup({...backup,products:[{...backup.products[0],category_id:"55555555-5555-4555-8555-555555555555"}]},restaurantId)).toThrow("categoría");
  });

  it("shows destructive differences and preserves protected domains",()=>{
    const preview=buildRestorePreview(parseRestaurantBackup(backup,restaurantId),current,[categoryId,"66666666-6666-4666-8666-666666666666"],["77777777-7777-4777-8777-777777777777"]);
    expect(preview.categories).toMatchObject({current:2,backup:1,added:0,removed:1});
    expect(preview.products).toMatchObject({current:1,backup:1,added:1,removed:1});
    expect(preview.changedSettings).toEqual(expect.arrayContaining(["name","logo_url","is_published"]));
    expect(preview.warnings.join(" ")).toContain("miembros");
  });

  it("blocks content restoration without an active plan",()=>{
    const parsed=parseRestaurantBackup(backup,restaurantId);
    const trialPreview=buildRestorePreview({...parsed,products:Array.from({length:2},(_,index)=>({...parsed.products[0],id:`0000000${index}-0000-4000-8000-00000000000${index}`}))},{...current,subscription_status:"trialing"},[],[]);
    expect(trialPreview.canApply).toBe(false);
    expect(trialPreview.warnings.at(-1)).toContain("Plan Carta");
  });
});
