import {describe,it,expect,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {ReactNode} from "react";
import {mkdirSync,writeFileSync} from "node:fs";
vi.mock("next/link",()=>({default:({href,children,...props}:{href:string;children:ReactNode})=><a href={href} {...props}>{children}</a>}));
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));
vi.mock("@/lib/supabase/client",()=>({createClient:vi.fn()}));
vi.mock("@/app/dashboard/ordering/actions",()=>({transitionDiningOrder:vi.fn(),createDiningTable:vi.fn(),setDiningTableActive:vi.fn()}));
vi.mock("@/app/dashboard/ordering/payment-actions",()=>({recordOrderPayment:vi.fn()}));
vi.mock("@/app/dashboard/ordering/settings-actions",()=>({saveOrderSettings:vi.fn()}));
vi.mock("@/app/dashboard/ordering/table-service-actions",()=>({setTableService:vi.fn()}));
vi.mock("@/components/dashboard/sign-out",()=>({SignOut:()=>null}));
vi.mock("@/components/dashboard/qr-card",()=>({QrCard:()=>null}));
import {KitchenBoard} from "@/components/dashboard/kitchen-board";
import {OrderSettings} from "@/components/dashboard/order-settings";
import {DiningTables} from "@/components/dashboard/dining-tables";
import {defaultOrderSettings,orderSettingsSchema} from "@/lib/order-settings";
import type {KitchenOrder} from "@/lib/kitchen-orders";
const order:KitchenOrder={id:"order",number:"A32BF815",status:"pending",subtotalCents:1700,customerNote:"Sin hielo",createdAt:new Date().toISOString(),tableName:"Terraza 4",fulfillment:"table",orderSource:"table_qr",paymentTiming:"before",paymentStatus:"unpaid",items:[{id:"item",name:"Ensalada de frutas",quantity:2,note:null,options:[{groupId:"fruit",groupName:"Frutas",optionId:"mango",name:"Mango",priceCents:50}]}]};
const render=(item:KitchenOrder)=>renderToStaticMarkup(<KitchenBoard restaurantId="restaurant" currency="EUR" isManager initialOrders={[item]}/>);
describe("QR ordering service views",()=>{
 it("shows unpaid advance orders once in Por cobrar and blocks preparation",()=>{
  const html=render(order);expect(html.match(/Comanda #/g)).toHaveLength(1);expect(html).toContain("Pendiente de pago");expect(html).toContain("Registrar cobro en TPV");expect(html).not.toContain("Empezar preparación");expect(html).not.toContain("Marcar como listo");expect(html).toContain("Mango");
 });
 it("allows preparation after registering payment",()=>{const html=render({...order,paymentStatus:"paid"});expect(html).toContain("Empezar preparación");expect(html).not.toContain("Registrar cobro en TPV")});
 it("keeps delivered unpaid QR orders visible until paid",()=>{const html=render({...order,status:"delivered",paymentTiming:"after"});expect(html).toContain("Comanda #");expect(html).toContain("Registrar cobro en TPV");expect(html).not.toContain("Empezar preparación")});
 it("offers menu-only safely when ordering is unavailable and keeps all days editable",()=>{const html=renderToStaticMarkup(<OrderSettings canOrder={false} initial={{...defaultOrderSettings,customer_order_mode:"table_orders"}}/>);expect(html).toContain('checked="" value="menu_only"');expect(html).toContain("Domingo");expect(html.match(/type="time"/g)).toHaveLength(14)});
 it("validates all seven weekdays, time format and timezone",()=>{
  expect(orderSettingsSchema.safeParse(defaultOrderSettings).success).toBe(true);
  for(const patch of [{timezone:"invented/place"},{opening_hours:[defaultOrderSettings.opening_hours[0]]},{opening_hours:defaultOrderSettings.opening_hours.map(day=>({...day,day:0}))},{opening_hours:defaultOrderSettings.opening_hours.map(day=>({...day,periods:[{start:"25:00",end:"23:00"}]}))}])expect(orderSettingsSchema.safeParse({...defaultOrderSettings,...patch}).success).toBe(false);
 });
 it("renders review artifacts from real settings, tables and kitchen components",()=>{
  mkdirSync("tmp",{recursive:true});const screens={settings:renderToStaticMarkup(<OrderSettings canOrder initial={{...defaultOrderSettings,customer_order_mode:"table_orders",payment_timing:"before"}}/>),kitchen:render(order),tables:renderToStaticMarkup(<DiningTables tables={[{id:"table",name:"Terraza 4",public_code:"00000000-0000-4000-8000-000000000001",is_active:true,orders_paused_until:null}]} slug="demo" root="https://menuly.es" closesAt="2026-09-16T21:00:00Z" enabled paused={false} canManage timezone="Europe/Madrid"/>)};
  for(const [name,html] of Object.entries(screens))writeFileSync(`tmp/service-${name}.html`,`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/tmp/preview.css"></head><body><div class="internal-green"><div style="max-width:1100px;margin:auto;padding:24px">${html}</div></div></body></html>`);
 });
});
