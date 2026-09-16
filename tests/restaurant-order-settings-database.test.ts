import {PGlite} from "@electric-sql/pglite";
import {readFileSync} from "node:fs";
import {beforeAll,afterAll,describe,it,expect} from "vitest";
const db=new PGlite();
const migration=(name:string)=>readFileSync(`supabase/migrations/${name}.sql`,"utf8");
beforeAll(async()=>{
  await db.exec(`create schema auth;create role anon;create role authenticated;create role service_role;
    create type public.subscription_state as enum ('trialing','active','past_due','canceled');
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql as 'select null::uuid';
    create function auth.role() returns text language sql as 'select ''service_role''::text';
    create function public.is_member(uuid) returns boolean language sql as 'select false';
    create function public.can_edit(uuid) returns boolean language sql as 'select false';
    create function public.set_updated_at() returns trigger language plpgsql as 'begin new.updated_at=now();return new;end';
    create table public.restaurants(id uuid primary key,owner_id uuid,plan text,subscription_status text,slug text,timezone text default 'Europe/Madrid',is_published boolean default true,access_suspended boolean default false,publication_suspended_for_payment boolean default false);
    create table public.restaurant_members(restaurant_id uuid,user_id uuid,role text);
    create table public.categories(id uuid primary key,restaurant_id uuid,is_active boolean default true);
    create table public.products(id uuid primary key,restaurant_id uuid,category_id uuid,name text,price_cents integer,is_available boolean default true,updated_at timestamptz not null default now());
    create publication supabase_realtime;`);
  await db.exec(migration("202608180001_table_ordering"));
  await db.exec(migration("202608200001_order_idempotency"));
  await db.exec(migration("202609150001_customizable_pickup"));
  await db.exec(migration("202609150002_restaurant_order_settings"));
  await db.exec(migration("202609160001_order_payment_confirmation"));
},30000);
afterAll(()=>db.close());

const fullWeek=Array.from({length:7},(_,day)=>({day,periods:[{start:"00:00",end:"00:00"}]}));
async function fixture(timing="after"){
 const restaurant=crypto.randomUUID(),category=crypto.randomUUID(),product=crypto.randomUUID(),actor=crypto.randomUUID(),table=crypto.randomUUID(),code=crypto.randomUUID();
 await db.query("insert into restaurants(id,subscription_status,ordering_enabled,customer_order_mode,payment_timing,opening_hours) values($1,'active',true,'table_orders',$2,$3)",[restaurant,timing,JSON.stringify(fullWeek)]);
 await db.query("insert into categories(id,restaurant_id) values($1,$2)",[category,restaurant]);
 const result=await db.query<{updated_at:Date}>("insert into products(id,restaurant_id,category_id,name,price_cents) values($1,$2,$3,'Ensalada',800) returning updated_at",[product,restaurant,category]);
 await db.query("insert into auth.users(id) values($1)",[actor]);await db.query("insert into restaurant_members values($1,$2,'kitchen')",[restaurant,actor]);
 await db.query("insert into restaurant_tables(id,restaurant_id,name,public_code) values($1,$2,'Mesa 1',$3)",[table,restaurant,code]);
 const items=[{product_id:product,product_name:"Ensalada",unit_price_cents:850,quantity:2,note:"Sin hielo",line_total_cents:1700,selected_options:[{groupId:crypto.randomUUID(),optionId:crypto.randomUUID(),groupName:"Frutas",name:"Mango",priceCents:50}],product_updated_at:result.rows[0].updated_at.toISOString()}];
 return{restaurant,table,code,actor,product,items,timing};
}
async function submit(f:Awaited<ReturnType<typeof fixture>>,request=crypto.randomUUID(),hash="device"){
 const result=await db.query<{result:{order_id:string;replayed:boolean;payment_timing:string}}>("select create_table_qr_order($1,$2,'',$3,$4,$5) as result",[f.code,request,JSON.stringify(f.items),hash,f.timing]);return result.rows[0].result;
}
async function context(code:string){return (await db.query<{result:{active:boolean}}>("select table_ordering_context($1) as result",[code])).rows[0].result}
async function windowAt(restaurant:string,time:string){return (await db.query("select * from restaurant_ordering_window($1,$2)",[restaurant,time])).rows}
describe("restaurant QR service in PostgreSQL",()=>{
 it("rejects changed payment terms atomically in both directions",async()=>{
  for(const timing of ["before","after"]){const f=await fixture(timing);await db.query("update restaurants set payment_timing=$2 where id=$1",[f.restaurant,timing==="before"?"after":"before"]);await expect(submit(f)).rejects.toThrow("payment_settings_changed");expect((await db.query("select id from dining_orders where table_id=$1",[f.table])).rows).toHaveLength(0);}
 });
 it("stores SQL and HTML payloads as inert text",async()=>{
  const f=await fixture();f.items[0].note="'); DROP TABLE dining_orders; -- <img src=x onerror=alert(1)>";const order=await submit(f);const result=await db.query<{note:string}>("select note from dining_order_items where order_id=$1",[order.order_id]);expect(result.rows[0].note).toBe(f.items[0].note);
 });
 it("opens and closes at exact local boundaries, including overnight and split shifts",async()=>{
  const f=await fixture();const hours=fullWeek.map(h=>({...h,periods:h.day===1?[{start:"12:00",end:"15:00"},{start:"20:00",end:"02:00"}]:[]}));
  await db.query("update restaurants set opening_hours=$2 where id=$1",[f.restaurant,JSON.stringify(hours)]);
  expect(await windowAt(f.restaurant,"2026-09-14T09:59:59Z")).toHaveLength(0);
  expect(await windowAt(f.restaurant,"2026-09-14T10:00:00Z")).toHaveLength(1);
  expect(await windowAt(f.restaurant,"2026-09-14T13:00:00Z")).toHaveLength(0);
  expect(await windowAt(f.restaurant,"2026-09-14T23:30:00Z")).toHaveLength(1);
  expect(await windowAt(f.restaurant,"2026-09-15T00:00:00Z")).toHaveLength(0);
 });
 it("handles Sunday overnight into Monday and daylight saving changes",async()=>{
  const f=await fixture();await db.query("update restaurants set opening_hours=$2 where id=$1",[f.restaurant,JSON.stringify(fullWeek.map(h=>({...h,periods:h.day===0?[{start:"20:00",end:"02:00"}]:[]})))]);
  expect(await windowAt(f.restaurant,"2026-09-13T23:30:00Z")).toHaveLength(1);
  await db.query("update restaurants set opening_hours=$2 where id=$1",[f.restaurant,JSON.stringify(fullWeek.map(h=>({...h,periods:h.day===6?[{start:"22:00",end:"04:00"}]:[]})))]);
  expect(await windowAt(f.restaurant,"2026-10-25T02:59:59Z")).toHaveLength(1);
  expect(await windowAt(f.restaurant,"2026-10-25T03:00:00Z")).toHaveLength(0);
  expect(await windowAt(f.restaurant,"2026-03-29T01:59:59Z")).toHaveLength(1);
  expect(await windowAt(f.restaurant,"2026-03-29T02:00:00Z")).toHaveLength(0);
 });
 it("rejects orders outside hours, in menu-only mode, and while paused",async()=>{
  const f=await fixture();expect((await context(f.code)).active).toBe(true);
  for(const sql of ["customer_order_mode='menu_only'","customer_orders_paused=true","ordering_enabled=false","is_published=false"]){
   await db.query(`update restaurants set ${sql} where id=$1`,[f.restaurant]);expect((await context(f.code)).active).toBe(false);await expect(submit(f)).rejects.toThrow("table_closed");
   await db.query("update restaurants set customer_order_mode='table_orders',customer_orders_paused=false,ordering_enabled=true,is_published=true where id=$1",[f.restaurant]);
  }
  await db.query("update restaurants set opening_hours='[]' where id=$1",[f.restaurant]);await expect(submit(f)).rejects.toThrow("table_closed");
 });
 it("resumes a paused table when its pause expires",async()=>{
  const f=await fixture();await db.query("update restaurant_tables set orders_paused_until=now()+interval '1 hour' where id=$1",[f.table]);await expect(submit(f)).rejects.toThrow("table_closed");
  await db.query("update restaurant_tables set orders_paused_until=now()-interval '1 second' where id=$1",[f.table]);expect((await context(f.code)).active).toBe(true);await submit(f);
 });
 it("snapshots options and payment timing, replays once even after closing",async()=>{
  const f=await fixture("before"),request=crypto.randomUUID(),order=await submit(f,request);expect(order.payment_timing).toBe("before");
  const items=await db.query<{selected_options:unknown}>("select selected_options from dining_order_items where order_id=$1",[order.order_id]);expect(items.rows[0].selected_options).toEqual(f.items[0].selected_options);
  await db.query("update restaurants set payment_timing='after',customer_orders_paused=true where id=$1",[f.restaurant]);expect(await submit(f,request)).toMatchObject({order_id:order.order_id,replayed:true,payment_timing:"before"});
 });
 it("blocks preparation until paid, records payment once, checks membership and tenant",async()=>{
  const f=await fixture("before"),order=await submit(f),other=await fixture();
  for(const status of ["accepted","preparing","ready","delivered"])await expect(db.query("update dining_orders set status=$2 where id=$1",[order.order_id,status])).rejects.toThrow("payment_required");
  const pay=(restaurant=f.restaurant,actor=f.actor)=>db.query<{paid:boolean}>("select record_order_payment($1,$2,$3,'Ticket 123') as paid",[restaurant,order.order_id,actor]);
  await expect(pay(f.restaurant,other.actor)).rejects.toThrow("forbidden");expect((await pay(other.restaurant,other.actor)).rows[0].paid).toBe(false);
  expect((await pay()).rows[0].paid).toBe(true);expect((await pay()).rows[0].paid).toBe(false);await db.query("update dining_orders set status='preparing' where id=$1",[order.order_id]);
 });
 it("prevents authenticated clients from changing protected payment fields directly",async()=>{
  const f=await fixture("before"),order=await submit(f);
  try{await expect(db.exec(`begin;
    grant usage on schema auth to authenticated;
    grant select,update on public.dining_orders to authenticated;
    create policy test_read on public.dining_orders for select to authenticated using(true);
    create policy test_update on public.dining_orders for update to authenticated using(true) with check(true);
    create or replace function auth.role() returns text language sql as 'select ''authenticated''::text';
    set local role authenticated;
    update dining_orders set payment_status='paid' where id='${order.order_id}';
  `)).rejects.toThrow("protected_payment_fields")}finally{await db.exec("rollback")}
 });
 it("allows post-payment orders to be prepared and delivered before recording payment",async()=>{
  const f=await fixture(),order=await submit(f);await db.query("update dining_orders set status='delivered' where id=$1",[order.order_id]);
  const result=await db.query<{paid:boolean}>("select record_order_payment($1,$2,$3) as paid",[f.restaurant,order.order_id,f.actor]);expect(result.rows[0].paid).toBe(true);
 });
 it("rejects stale and cross-tenant products without partial orders",async()=>{
  const f=await fixture(),other=await fixture();f.items=other.items;await expect(submit(f)).rejects.toThrow("product_changed");expect((await db.query("select id from dining_orders where table_id=$1",[f.table])).rows).toHaveLength(0);
 });
 it("limits repeated submissions and keeps replay working",async()=>{
  const f=await fixture(),request=crypto.randomUUID();await submit(f,request);for(let i=0;i<4;i++)await submit(f);await expect(submit(f)).rejects.toThrow("rate_limit");expect((await submit(f,request)).replayed).toBe(true);
 });
 it("does not grant public order creation or payment and retires pickup creation",async()=>{
  for(const signature of ['create_table_qr_order(uuid,uuid,text,jsonb,text,text)','record_order_payment(uuid,uuid,uuid,text)'])for(const role of ['anon','authenticated'])expect((await db.query<{allowed:boolean}>("select has_function_privilege($1,$2,'execute') as allowed",[role,signature])).rows[0].allowed).toBe(false);
  expect((await db.query<{allowed:boolean}>("select has_function_privilege('service_role','create_pickup_order(uuid,uuid,text,jsonb,text)','execute') as allowed")).rows[0].allowed).toBe(false);
 });
});
