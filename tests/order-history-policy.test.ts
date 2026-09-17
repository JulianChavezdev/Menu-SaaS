import {PGlite} from "@electric-sql/pglite";
import {readFileSync} from "node:fs";
import {beforeAll,afterAll,it,expect} from "vitest";
const db=new PGlite();
beforeAll(async()=>{
  await db.exec(`create role anon;create role authenticated;create role service_role;
    create table dining_order_items(id int,restaurant_id uuid,product_name text);
    create function is_member(target uuid) returns boolean language sql as 'select target::text=current_setting(''test.restaurant'',true)';
    grant select on dining_order_items to anon,authenticated;
    insert into dining_order_items values(1,'11111111-1111-4111-8111-111111111111','Ensalada'),(2,'22222222-2222-4222-8222-222222222222','Otro restaurante');
    alter table dining_order_items enable row level security;`);
  const migration=readFileSync('supabase/migrations/202609170001_restore_order_item_read_policy.sql','utf8');await db.exec(migration);await db.exec(migration);
},30000);
afterAll(()=>db.close());
it('lets members read their order snapshots without exposing other restaurants',async()=>{
  try{await db.exec(`begin;set local role authenticated;set local "test.restaurant"='11111111-1111-4111-8111-111111111111'`);expect((await db.query('select product_name from dining_order_items')).rows).toEqual([{product_name:'Ensalada'}])}finally{await db.exec('rollback')}
});
it('denies anonymous and unrelated users',async()=>{
  for(const role of ['anon','authenticated'])try{await db.exec(`begin;set local role ${role}`);expect((await db.query('select * from dining_order_items')).rows).toEqual([])}finally{await db.exec('rollback')}
});
it('detects policy drift instead of only checking table columns',async()=>{
  expect((await db.query<{ready:boolean}>('select order_history_policy_ready() as ready')).rows[0].ready).toBe(true);
  try{await db.exec('begin;drop policy "members read dining order items" on dining_order_items');expect((await db.query<{ready:boolean}>('select order_history_policy_ready() as ready')).rows[0].ready).toBe(false)}finally{await db.exec('rollback')}
});
