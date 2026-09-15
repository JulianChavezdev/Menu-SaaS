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
    create table public.restaurants(id uuid primary key,owner_id uuid,plan text,subscription_status text,is_published boolean default true,access_suspended boolean default false,publication_suspended_for_payment boolean default false);
    create table public.restaurant_members(restaurant_id uuid,user_id uuid,role text);
    create table public.categories(id uuid primary key,restaurant_id uuid,is_active boolean default true);
    create table public.products(id uuid primary key,restaurant_id uuid,category_id uuid,name text,price_cents integer,is_available boolean default true,updated_at timestamptz not null default now());
    create publication supabase_realtime;`);
  await db.exec(migration("202608180001_table_ordering"));
  await db.exec(migration("202608200001_order_idempotency"));
  await db.exec(migration("202609150001_customizable_pickup"));
},30000);
afterAll(()=>db.close());
async function fixture(){
  const restaurant=crypto.randomUUID(),category=crypto.randomUUID(),product=crypto.randomUUID(),actor=crypto.randomUUID();
  await db.query("insert into restaurants(id,subscription_status,ordering_enabled,pickup_enabled) values($1,'active',true,true)",[restaurant]);
  await db.query("insert into categories(id,restaurant_id) values($1,$2)",[category,restaurant]);
  const result=await db.query<{updated_at:Date}>("insert into products(id,restaurant_id,category_id,name,price_cents) values($1,$2,$3,'Ensalada',800) returning updated_at",[product,restaurant,category]);
  await db.query("insert into auth.users(id) values($1)",[actor]);await db.query("insert into restaurant_members values($1,$2,'waiter')",[restaurant,actor]);
  const options=[{groupId:crypto.randomUUID(),groupName:"Frutas",optionId:crypto.randomUUID(),name:"Mango",priceCents:50}];
  const items=[{product_id:product,product_name:"Ensalada",unit_price_cents:850,quantity:2,note:"Sin hielo",line_total_cents:1700,selected_options:options,product_updated_at:result.rows[0].updated_at.toISOString()}];
  return{restaurant,product,actor,items};
}
async function submit(f:Awaited<ReturnType<typeof fixture>>,request=crypto.randomUUID(),hash="device"){
  return db.query<{order_id:string;order_public_token:string;order_status:string;replayed:boolean}>("select * from create_pickup_order($1,$2,'',$3::jsonb,$4)",[f.restaurant,request,JSON.stringify(f.items),hash]);
}
describe("pickup transaction in PostgreSQL",()=>{
  it("atomically snapshots options, totals and replays a request once",async()=>{const f=await fixture();const request=crypto.randomUUID();const first=await submit(f,request);const second=await submit(f,request);expect(second.rows[0].order_id).toBe(first.rows[0].order_id);expect(second.rows[0].replayed).toBe(true);const items=await db.query<{selected_options:unknown;line_total_cents:number}>("select selected_options,line_total_cents from dining_order_items where order_id=$1",[first.rows[0].order_id]);expect(items.rows[0].selected_options).toEqual(f.items[0].selected_options);expect(items.rows[0].line_total_cents).toBe(1700)});
  it("rejects changed products and rolls back the entire order",async()=>{const f=await fixture();await db.query("update products set updated_at=now()+interval '1 second' where id=$1",[f.product]);await expect(submit(f)).rejects.toThrow("product_changed");const result=await db.query("select id from dining_orders where restaurant_id=$1",[f.restaurant]);expect(result.rows).toHaveLength(0)});
  it("refuses cross-restaurant products and paused ordering",async()=>{const a=await fixture(),b=await fixture();a.items=b.items;await expect(submit(a)).rejects.toThrow("product_changed");await db.query("update restaurants set pickup_paused=true where id=$1",[b.restaurant]);await expect(submit(b)).rejects.toThrow("pickup_unavailable")});
  it("enforces rate limits and still replays accepted orders",async()=>{const f=await fixture();const request=crypto.randomUUID();await submit(f,request);for(let i=0;i<4;i++)await submit(f);await expect(submit(f)).rejects.toThrow("rate_limit");expect((await submit(f,request)).rows[0].replayed).toBe(true)});
  it("only cashier roles can mark a ready order paid and delivered, once",async()=>{const f=await fixture();const order=(await submit(f)).rows[0].order_id;
    const complete=()=>db.query<{complete_pickup_order:boolean}>("select complete_pickup_order($1,$2,$3)",[f.restaurant,order,f.actor]);
    expect((await complete()).rows[0].complete_pickup_order).toBe(false);
    await db.query("update dining_orders set status='ready' where id=$1",[order]);await db.query("update restaurant_members set role='kitchen' where user_id=$1",[f.actor]);await expect(complete()).rejects.toThrow("forbidden");await db.query("update restaurant_members set role='waiter' where user_id=$1",[f.actor]);expect((await complete()).rows[0].complete_pickup_order).toBe(true);expect((await complete()).rows[0].complete_pickup_order).toBe(false);
    const saved=await db.query<{payment_status:string;status:string}>("select payment_status,status from dining_orders where id=$1",[order]);expect(saved.rows[0]).toEqual({payment_status:"paid",status:"delivered"});
  });
  it("does not expose order creation or payment RPCs to anonymous users",async()=>{const grants=await db.query<{create_allowed:boolean;pay_allowed:boolean}>("select has_function_privilege('anon','create_pickup_order(uuid,uuid,text,jsonb,text)','execute') as create_allowed,has_function_privilege('authenticated','complete_pickup_order(uuid,uuid,uuid)','execute') as pay_allowed");expect(grants.rows[0]).toEqual({create_allowed:false,pay_allowed:false})});
});
