import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const db = new PGlite();
await db.exec(`
 create role anon nologin; create role authenticated nologin;
 create schema auth;
 create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth, public to anon,authenticated;
 grant execute on function auth.uid() to anon,authenticated;
`);
await db.exec(await readFile(new URL('../supabase/001_auth_wallet.sql', import.meta.url),'utf8'));
const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';
await db.query(`insert into auth.users(id,email,raw_user_meta_data) values ($1,'alice@example.test','{"display_name":"Alice","role":"admin"}'),($2,'bob@example.test','{"display_name":"Bob"}')`,[alice,bob]);
assert.equal((await db.query('select role from public.profiles where id=$1',[alice])).rows[0].role,'user');
async function asUser(id, fn) {
  await db.exec(`set role authenticated; set request.jwt.claim.sub='${id}';`);
  try { return await fn(); } finally { await db.exec('reset role; reset request.jwt.claim.sub;'); }
}
async function wallet() { return (await db.query('select public.wallet_snapshot() as wallet')).rows[0].wallet; }
async function mutate(kind,amount,name='',category='',goal=null,initial=0,date='2026-10-25') {
  return (await db.query('select public.wallet_mutate($1,$2,$3,$4,$5,\'\',$6,$7) as wallet',[kind,amount,name,category,date,goal,initial])).rows[0].wallet;
}
let goalId;
await asUser(alice,async()=>{
  assert.equal((await wallet()).balance,0);
  assert.equal((await mutate('income',500000,'Uang Saku')).balance,500000);
  assert.equal((await mutate('expense',100000,'Makan','Makanan')).balance,400000);
  let next=await mutate('goal',100000,'Buku','',null,50000);
  assert.equal(next.balance,350000); assert.equal(next.goals[0].saved,50000); goalId=next.goals[0].id;
  next=await mutate('transfer',20000,'','',goalId);
  assert.equal(next.balance,330000); assert.equal(next.goals[0].saved,70000);
  await assert.rejects(()=>mutate('expense',500000,'Makan','Makanan'),/Saldo tidak cukup/);
  await assert.rejects(()=>mutate('transfer',40000,'','',goalId),/sisa target/);
  await assert.rejects(()=>mutate('goal',100000,'Laptop','',null,100001),/melebihi target/);
  await assert.rejects(()=>mutate('income',0,'Invalid'),/Nominal tidak valid/);
  assert.equal((await wallet()).balance,330000);
  await assert.rejects(()=>db.query("update public.profiles set role='admin' where id=$1",[alice]),/permission denied/);
  await assert.rejects(()=>db.query('select * from public.admin_members()'),/Akses admin diperlukan/);
});
await asUser(bob,async()=>{
  assert.equal((await wallet()).balance,0);
  assert.equal((await db.query('select * from public.savings_goals')).rows.length,0);
  assert.equal((await db.query('select * from public.profiles')).rows.length,1);
  await mutate('income',150000,'Hadiah');
  await assert.rejects(()=>mutate('transfer',10000,'','',goalId),/tidak ditemukan/);
  assert.equal((await wallet()).balance,150000);
  await assert.rejects(()=>db.query('update public.wallet_accounts set balance=999999'),/permission denied/);
});
await db.query("update public.profiles set role='admin' where id=$1",[alice]);
await asUser(alice,async()=>{
  assert.equal((await db.query('select * from public.admin_members()')).rows.length,2);
  assert.equal((await db.query('select * from public.wallet_accounts')).rows.length,1);
  assert.equal((await wallet()).balance,330000);
});
await db.exec('set role anon;');
await assert.rejects(()=>db.query('select public.wallet_snapshot()'),/permission denied/);
await assert.rejects(()=>db.query('select * from public.profiles'),/permission denied/);
await db.exec('reset role;');
console.log('PASS: SQL migration, signup role protection, wallet mutations/rollback, account isolation, blocked self-promotion/direct writes, admin-only members, anonymous access denied');
await db.close();

