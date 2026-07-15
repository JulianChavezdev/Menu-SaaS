import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const page=readFileSync("src/app/superadmin/analytics/page.tsx","utf8");
const layout=readFileSync("src/app/superadmin/layout.tsx","utf8");
const menu=readFileSync("src/components/menu/video-menu.tsx","utf8");

describe("analíticas de superadmin",()=>{
  it("están enlazadas y protegidas por el layout privado",()=>{expect(layout).toContain('/superadmin/analytics');expect(page).toContain("requireSuperadmin")});
  it("muestra todas las métricas y periodos",()=>{for(const copy of["Visitas a cartas","Productos vistos","Vídeos reproducidos","Añadidos al carrito","Compartidos","Contactos","Restaurantes con más actividad","Productos más vistos"])expect(page).toContain(copy);for(const period of["7 días","30 días","90 días","1 año","Todo"])expect(page).toContain(period)});
  it("registra vídeo y carrito con producto sin almacenar visitantes",()=>{expect(menu).toContain('event:"video_play"');expect(menu).toContain('event:"cart_add"');expect(page).toContain("sin cookies, IP ni identificadores de visitante")});
});
