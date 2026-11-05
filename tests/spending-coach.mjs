import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spendingInsight, motivationFor, motivationMessages } from '../src/spending-coach.js';
const now = new Date('2026-11-05T09:00:00Z');
const row = (kind, amount, date = '05/11/2026') => ({ id: `${kind}-${amount}-${date}`, kind, amount, date });
const report = (expense, limit = 0, income = 100000) => spendingInsight([row('income', income), row('expense', expense)], limit, now);
test('no entries, only savings and only income do not pretend to measure thrift', () => {
  assert.equal(spendingInsight([],0,now).state,'empty');
  assert.equal(spendingInsight([row('transfer',50000)],0,now).state,'empty');
  assert.equal(spendingInsight([row('income',100000)],0,now).state,'start');
});
test('missing income stays neutral, or uses a budget when available', () => {
  const rows=[row('expense',20000)];
  assert.equal(spendingInsight(rows,0,now).state,'incomplete');
  assert.equal(spendingInsight(rows,100000,now).state,'budget');
  assert.equal(spendingInsight(rows,NaN,now).state,'incomplete');
});
test('70 percent income boundary and expense exceeding income give distinct, explained results', () => {
  assert.equal(report(70000).state,'steady');
  assert.equal(report(70001).state,'watch');
  assert.equal(report(100001).state,'watch');
  assert.match(report(100001).explanation,/saldo bulan lalu/);
});
test('budget 80 and 100 percent boundaries take priority over high income', () => {
  assert.equal(report(79999,100000,1000000).state,'steady');
  assert.equal(report(80000,100000,1000000).state,'watch');
  assert.equal(report(100000,100000,1000000).state,'watch');
  assert.equal(report(100001,100000,1000000).state,'over');
});
test('transfers and entries in other months never inflate spending', () => {
  const rows=[row('income',100000),row('expense',20000),row('expense',900000,'31/10/2026'),row('transfer',50000)];
  const before=JSON.stringify(rows), result=spendingInsight(rows,0,now);
  assert.equal(result.state,'steady');assert.equal(result.expense,20000);assert.equal(result.transfer,50000);assert.equal(result.incomeRatio,.2);assert.equal(JSON.stringify(rows),before);
});
test('period changes at Jakarta midnight, including New Year', () => {
  const result=spendingInsight([row('income',100000,'01/01/2027'),row('expense',80000,'31/12/2026')],0,new Date('2026-12-31T17:00:00Z'));
  assert.equal(result.month,'2027-01');assert.equal(result.state,'start');
});
test('messages stay stable on refresh, cycle without adjacent repeats and tolerate unknown states', () => {
  const insight=report(50000), original=motivationFor(insight,'student-a');
  assert.equal(original,motivationFor(report(50000),'student-a'));
  const length=motivationMessages[insight.state].length;
  const cycle=Array.from({length},(_,offset)=>motivationFor(insight,'student-a',offset));
  assert.equal(new Set(cycle).size,length);assert.equal(motivationFor(insight,'student-a',length),original);
  assert.equal(typeof motivationFor({...insight,state:'unknown'},'student-a'),'string');
});
