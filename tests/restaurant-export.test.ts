import {describe,expect,it} from "vitest";
import {productsCsv,restaurantBackup,safeExportName} from "../src/lib/restaurant-export";

describe("restaurant exports",()=>{
  it("creates safe deterministic filenames",()=>{
    expect(safeExportName("Pizzería Roma / Centro")).toBe("pizzeria-roma-centro");
    expect(safeExportName("../../")).toBe("restaurant");
  });

  it("exports an Excel-friendly CSV and neutralizes formulas",()=>{
    const csv=productsCsv([{category:"Postres",name:'=HYPERLINK("bad")',description:'Tarta "especial"',price_cents:650,currency:"EUR",is_available:true}]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"\'=HYPERLINK(""bad"")"');
    expect(csv).toContain('"Tarta ""especial"""');
    expect(csv).toContain('"6.50"');
  });

  it("marks JSON backups as manifests without embedded media",()=>{
    const backup=JSON.parse(restaurantBackup({restaurant:{slug:"demo"},products:[]}));
    expect(backup).toMatchObject({format:"carta-video.restaurant-backup",version:1,mediaFilesIncluded:false,restaurant:{slug:"demo"}});
    expect(backup.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
