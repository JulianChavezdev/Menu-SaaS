import {PGlite} from "@electric-sql/pglite";
import {readFileSync} from "node:fs";
import {beforeAll,afterAll,it,expect} from "vitest";
const db=new PGlite();const owner='11111111-1111-4111-8111-111111111111',restaurant='22222222-2222-4222-8222-222222222222';
beforeAll(async()=>{
 await db.exec(`create schema auth;create role anon;create role authenticated;create role service_role;
 create function auth.uid() returns uuid language sql as 'select nullif(current_setting(''test.user_id'',true),'''')::uuid';
 create function auth.role() returns text language sql as 'select current_user::text';
 create table restaurants(id uuid primary key,owner_id uuid,name text,plan text,subscription_status text,ordering_enabled boolean,signup_plan_interest text,access_suspended boolean,suspension_reason text,suspended_at timestamptz,publication_suspended_for_payment boolean,is_published boolean);
 create function is_member(target uuid) returns boolean language sql security definer set search_path=public as 'select exists(select 1 from restaurants where id=target and owner_id=auth.uid())';
 alter table restaurants enable row level security;
 grant usage on schema public,auth to anon,authenticated;
 grant select,insert,update on restaurants to anon,authenticated;
 create policy "public published restaurants" on restaurants for select using(is_published or is_member(id));
 create policy "owners create restaurants" on restaurants for insert with check(owner_id=auth.uid());
 create policy "members update restaurants" on restaurants for update using(is_member(id));
 insert into restaurants(id,owner_id,name,plan,subscription_status,ordering_enabled,signup_plan_interest,access_suspended,publication_suspended_for_payment,is_published) values('${restaurant}','${owner}','Test','carta','active',false,'carta',false,true,true);
 `);
 await db.exec(readFileSync('supabase/migrations/202609160002_private_restaurant_settings.sql','utf8'));
 await db.exec('create trigger protection before update on restaurants for each row execute function protect_restaurant_system_fields()');
},30000);
afterAll(()=>db.close());
it('hides private rows from anonymous and unrelated authenticated users',async()=>{
 for(const role of ['anon','authenticated']){try{await db.exec(`begin;set local role ${role}`);expect((await db.query('select * from restaurants')).rows).toHaveLength(0)}finally{await db.exec('rollback')}}
});
it('preserves member access and edits to ordinary restaurant settings',async()=>{
 try{await db.exec(`begin;set local role authenticated;set local "test.user_id"='${owner}';`);expect((await db.query('select id from restaurants')).rows).toHaveLength(1);expect((await db.query("update restaurants set name='Changed' returning name")).rows).toEqual([{name:'Changed'}])}finally{await db.exec('rollback')}
});
it('blocks direct restaurant creation with fabricated paid access',async()=>{
 try{await expect(db.exec(`begin;set local role authenticated;set local "test.user_id"='${owner}';insert into restaurants(id,owner_id,subscription_status) values(gen_random_uuid(),'${owner}','active')`)).rejects.toThrow('row-level security')}finally{await db.exec('rollback')}
});
it('protects billing, suspension and publication fields from members',async()=>{
 for(const change of ["plan='pedidos'","ordering_enabled=true","subscription_status='trialing'","access_suspended=true","publication_suspended_for_payment=false","suspension_reason='erased'","suspended_at=now()"]){try{await expect(db.exec(`begin;set local role authenticated;set local "test.user_id"='${owner}';update restaurants set ${change}`)).rejects.toThrow('Protected restaurant fields')}finally{await db.exec('rollback')}}
});
