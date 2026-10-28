import { test } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { availableMonths, monthlyTotals, shiftMonth, statistics } from '../src/statistics-utils.js';
import { statisticsExcel } from '../src/statistics-export.js';
const rows = [
  { id: 'a', date: '01/01/2026', title: 'Uang saku', category: 'Pemasukan', kind: 'income', amount: 500000 },
  { id: 'b', date: '03/01/2026', title: '=HYPERLINK("https://example.test")', category: 'Makanan', kind: 'expense', amount: 80000, notes: '+SUM(1,2)\nCatatan, "uji"' },
  { id: 'c', date: '04/01/2026', title: 'Bis', category: 'Transportasi', kind: 'expense', amount: 20000 },
  { id: 'd', date: '05/01/2026', title: 'Tabungan', category: 'Transfer ke Celengan', kind: 'transfer', amount: 100000 },
  { id: 'e', date: '31/12/2025', title: 'Bulan sebelumnya', category: 'Makanan', kind: 'expense', amount: 200000 },
  { id: 'f', date: '01/02/2026', title: 'Bulan berikutnya', category: 'Pemasukan', kind: 'income', amount: 900000 },
];
test('monthly report separates transfers, compares previous month and fills six-month gaps across year boundary', () => {
  const report = statistics(rows, '2026-01');
  assert.deepEqual([report.income, report.expense, report.net, report.transfer, report.count], [500000, 100000, 400000, 100000, 4]);
  assert.equal(report.expenseChange, -50); assert.equal(report.dailyAverage, Math.round(100000/31));
  assert.equal(report.categories[0].name, 'Makanan'); assert.equal(report.categories[0].percent, 80);
  assert.deepEqual(report.trend.map(row => row.month), ['2025-08','2025-09','2025-10','2025-11','2025-12','2026-01']);
  assert.equal(report.trend[0].expense, 0);
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.deepEqual(availableMonths(rows, '2026-03'), ['2026-03','2026-02','2026-01','2025-12']);
  assert.equal(monthlyTotals(rows,'2026-01').rows.length,4);
});
test('empty month, leap year and no previous expense produce finite zero values', () => {
  const report = statistics([], '2024-02');
  assert.equal(report.days, 29); assert.equal(report.dailyAverage, 0); assert.equal(report.expenseChange, null);
  assert.equal(report.net, 0); assert.deepEqual(report.categories, []);
});
test('xlsx round-trip retains numeric totals, plain user text, selected transactions and six-month trend', async () => {
  const buffer = await statisticsExcel(rows, '2026-01');
  assert.equal(String.fromCharCode(buffer[0],buffer[1]), 'PK');
  const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(buffer);
  assert.deepEqual(workbook.worksheets.map(sheet=>sheet.name), ['Ringkasan','Transaksi','Kategori','Tren 6 Bulan']);
  const summary = workbook.getWorksheet('Ringkasan');
  assert.equal(summary.getCell('B2').value, 500000); assert.equal(summary.getCell('B3').value,100000);
  assert.equal(summary.getCell('B4').value,400000); assert.equal(summary.getCell('B5').value,100000);
  const transactions = workbook.getWorksheet('Transaksi');
  assert.equal(transactions.rowCount,5); assert.equal(transactions.getCell('E3').type,ExcelJS.ValueType.Number);
  assert.equal(transactions.getCell('B3').value,rows[1].title); assert.equal(transactions.getCell('B3').type,ExcelJS.ValueType.String);
  assert.equal(transactions.getCell('F3').value,rows[1].notes); assert.equal(transactions.getCell('F3').type,ExcelJS.ValueType.String);
  assert.equal(transactions.views[0].ySplit,1); assert.ok(transactions.autoFilter);
  assert.equal(workbook.getWorksheet('Kategori').getCell('C2').value,.8);
  assert.equal(workbook.getWorksheet('Tren 6 Bulan').rowCount,7);
  assert.equal(workbook.getWorksheet('Tren 6 Bulan').getCell('C6').value,200000);
  assert.equal(rows[0].id,'a'); // Export must not mutate source ordering.
});
