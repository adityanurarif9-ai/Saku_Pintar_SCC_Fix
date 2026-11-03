import { test } from 'node:test';
import assert from 'node:assert/strict';
import { budgetSummary, historyTotals, sortTransactions } from '../src/budget-utils.js';
const rows=[{kind:'expense',date:'03/11/2026',amount:80000},{kind:'transfer',date:'03/11/2026',amount:90000},{kind:'expense',date:'31/10/2026',amount:50000},{kind:'income',date:'01/11/2026',amount:200000}];
test('budget uses Jakarta month, excludes transfers and includes today',()=>{const r=budgetSummary(rows,100000,new Date('2026-11-02T18:00:00Z'));assert.equal(r.spent,80000);assert.equal(r.daysLeft,28);assert.equal(r.percent,80);assert.equal(r.daily,714);});
test('overspend and invalid limit never suggest negative allowance',()=>{assert.equal(budgetSummary(rows,50000,new Date('2026-11-03')).over,30000);assert.equal(budgetSummary(rows,0).valid,false);assert.equal(budgetSummary(rows,50000,new Date('2026-11-03')).daily,0);});
test('last day and leap year day count',()=>{assert.equal(budgetSummary([],1000,new Date('2028-02-29T08:00:00Z')).daysLeft,1);});
test('history totals distinguish savings and sorting does not mutate input',()=>{assert.deepEqual(historyTotals(rows),{income:200000,expense:130000,transfer:90000});assert.equal(sortTransactions(rows,'oldest')[0].date,'31/10/2026');assert.equal(sortTransactions(rows,'largest')[0].amount,200000);assert.equal(rows[0].amount,80000);assert.deepEqual(historyTotals([]),{income:0,expense:0,transfer:0});});
