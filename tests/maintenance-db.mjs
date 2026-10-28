import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const db=new PGlite();
await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;
create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth,public to anon,authenticated;`);
await db.exec(await readFile(new URL('../supabase/001_auth_wallet.sql',import.meta.url),'utf8'));
const migration=await readFile(new URL('../supabase/003_maintenance.sql',import.meta.url),'utf8');
await db.exec(migration);await db.exec(migration);
const admin='11111111-1111-4111-8111-111111111111',user='22222222-2222-4222-8222-222222222222';
await db.query("insert into auth.users(id,email) values($1,'admin@example.test'),($2,'user@example.test')",[admin,user]);
await db.query("update public.profiles set role='admin' where id=$1",[admin]);
async function asUser(id,fn){await db.exec(`set role authenticated;set request.jwt.claim.sub='${id}';`);try{await fn();}finally{await db.exec('reset role;reset request.jwt.claim.sub;');}}
async function status(){return(await db.query('select public.app_runtime_status() as status')).rows[0].status;}
async function set(enabled,message){return(await db.query('select public.set_app_maintenance($1,$2) as status',[enabled,message])).rows[0].status;}
await db.exec('set role anon;');
assert.equal((await status()).maintenance,false);
assert.deepEqual(Object.keys(await status()).sort(),['maintenance','message','updated_at']);
await assert.rejects(()=>set(true,'Anon'),/permission denied/);
await assert.rejects(()=>db.query('select * from public.saku_app_settings'),/permission denied/);
await db.exec('reset role;');
await asUser(user,async()=>{
 await db.exec("set request.jwt.claim.role='admin'");
 await assert.rejects(()=>set(true,'Spoofed admin'),/Akses admin/);
 await assert.rejects(()=>db.query('update public.saku_app_settings set maintenance=true'),/permission denied/);
});
await asUser(admin,async()=>{
 const next=await set(true,' Pembaruan sedang berlangsung. ');assert.equal(next.maintenance,true);assert.equal(next.message,'Pembaruan sedang berlangsung.');
 await assert.rejects(()=>set(false,' '),/1 sampai 240/);assert.equal((await status()).maintenance,true);
 await assert.rejects(()=>set(false,'a'.repeat(241)),/1 sampai 240/);
 await assert.rejects(()=>set(null,'Invalid'),/1 sampai 240/);
});
await db.exec(migration);assert.equal((await status()).maintenance,true);
await asUser(user,async()=>{
 await assert.rejects(()=>db.query("select public.wallet_mutate('income',1000,'Test')"),/Maintenance sedang berlangsung/);
 await assert.rejects(()=>db.query("select public.wallet_mutate('goal',1000,'Buku')"),/Maintenance sedang berlangsung/);
});
assert.equal((await db.query('select balance from public.wallet_accounts where user_id=$1',[user])).rows[0].balance,0);
assert.equal((await db.query('select count(*)::int as n from public.wallet_transactions')).rows[0].n,0);
assert.equal((await db.query('select count(*)::int as n from public.savings_goals')).rows[0].n,0);
await asUser(admin,async()=>{await db.query("select public.wallet_mutate('income',1000,'Pengecekan admin')");});
await asUser(admin,async()=>{await set(false,'Selesai.');assert.equal((await status()).maintenance,false);});
await asUser(user,async()=>{await db.query("select public.wallet_mutate('income',2000,'Sesudah maintenance')");});
assert.equal((await db.query('select balance from public.wallet_accounts where user_id=$1',[user])).rows[0].balance,2000);
console.log('PASS: maintenance default off, preserved state, safe public status, verified admin toggle, wallet writes blocked atomically for users and resume afterward');
await db.close();
