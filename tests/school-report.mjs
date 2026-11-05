import { test } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { schoolReport, reportMonthRange, parseReportDate } from '../src/school-report.js';
import { statisticsExcel } from '../src/statistics-export.js';

// Snapshot order: newest first. Two entries on the same day retain their recording order.
const rows = [
  { date:'01/02/2026',title:'Bulan berikutnya',kind:'income',category:'Pemasukan',amount:100000 },
  { date:'04/01/2026',title:'Tabungan laptop',kind:'transfer',category:'Transfer ke Celengan',amount:20000 },
  { date:'03/01/2026',title:'=HYPERLINK("https://example.test")',kind:'expense',category:'Makanan',amount:15000,notes:'+SUM(1,2)\nNasi ayam, es teh di kantin' },
  { date:'03/01/2026',title:'Uang saku dari ibu',kind:'income',category:'Pemasukan',amount:50000 },
  { date:'31/12/2025',title:'Saldo dari bulan lalu',kind:'income',category:'Pemasukan',amount:100000 },
];
test('opening, closing and chronological ledger include transfers exactly once',()=>{
  const report=schoolReport(rows,'2026-01',{currentBalance:215000});
  assert.equal(report.opening,100000);assert.equal(report.income,50000);assert.equal(report.expense,15000);assert.equal(report.transfer,20000);assert.equal(report.net,35000);assert.equal(report.closing,115000);
  assert.deepEqual(report.rows.map(row=>row.balance),[150000,135000,115000]);
  assert.equal(report.daily[0].count,0);assert.equal(report.daily[0].balance,100000);assert.equal(report.daily[2].count,2);assert.equal(report.daily.at(-1).balance,115000);
  assert.equal(rows[0].title,'Bulan berikutnya');
});
test('custom period includes both boundary dates, leap day, and excludes outside transactions',()=>{
  const report=schoolReport(rows,'2026-01',{startDate:'2026-01-03',endDate:'2026-01-03'});
  assert.equal(report.count,2);assert.equal(report.days,1);assert.equal(report.opening,100000);assert.equal(report.closing,135000);
  assert.equal(reportMonthRange('2024-02').endDate,'2024-02-29');
  assert.equal(schoolReport([],'2024-02').daily.length,29);
  assert.equal(parseReportDate('2026-02-30'),null);
  for(const options of [{startDate:'2026-02-30'},{startDate:'2026-02-02',endDate:'2026-01-01'},{startDate:'2024-01-01',endDate:'2026-01-01'}])assert.throws(()=>schoolReport(rows,'2026-01',options));
});
test('xlsx retains real dates, typed money, literal notes, identity, formulas and daily totals',async()=>{
  const buffer=await statisticsExcel(rows,'2026-01',{studentName:'Siswa Contoh',className:'X PPLG 1',studentNumber:'02',school:'Sekolah Contoh',reflection:'Lebih hemat jajan.',currentBalance:215000});
  const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(buffer);
  assert.deepEqual(workbook.worksheets.map(s=>s.name),['Ringkasan','Transaksi','Rekap Harian','Kategori','Tren 6 Bulan']);
  const summary=workbook.getWorksheet('Ringkasan');assert.equal(summary.getCell('B2').value,'Siswa Contoh');assert.equal(summary.getCell('B4').value,'02');assert.equal(summary.getCell('B8').value,100000);assert.equal(summary.getCell('B9').result,50000);assert.equal(summary.getCell('B10').result,15000);assert.equal(summary.getCell('B13').result,115000);assert.equal(summary.getCell('B19').value,'Lebih hemat jajan.');
  const ledger=workbook.getWorksheet('Transaksi');assert.equal(ledger.rowCount,4);assert.equal(ledger.getCell('B2').type,ExcelJS.ValueType.Date);assert.equal(ledger.getCell('B2').value.toISOString(),'2026-01-03T00:00:00.000Z');assert.equal(ledger.getCell('G2').type,ExcelJS.ValueType.Number);assert.equal(ledger.getCell('H3').value,15000);
  assert.equal(ledger.getCell('E3').value,rows[2].title);assert.equal(ledger.getCell('E3').type,ExcelJS.ValueType.String);assert.equal(ledger.getCell('K3').value,rows[2].notes);assert.equal(ledger.getCell('K3').type,ExcelJS.ValueType.String);assert.equal(ledger.getCell('J4').result,115000);assert.match(ledger.getCell('J2').formula,/Ringkasan/);assert.ok(ledger.autoFilter);assert.equal(ledger.views[0].ySplit,1);assert.equal(ledger.views[0].xSplit,2);
  const daily=workbook.getWorksheet('Rekap Harian');assert.equal(daily.rowCount,32);assert.equal(daily.getCell('D4').result,15000);assert.equal(daily.getCell('G4').result,2);assert.equal(daily.getCell('F32').result,115000);
  assert.equal(workbook.getWorksheet('Kategori').getCell('C2').result,1);assert.equal(workbook.getWorksheet('Tren 6 Bulan').rowCount,7);
});
test('empty range preserves opening balance and exports no invented transactions',async()=>{
  const buffer=await statisticsExcel(rows,'2026-01',{startDate:'2026-01-05',endDate:'2026-01-06'});const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(buffer);
  assert.equal(workbook.getWorksheet('Ringkasan').getCell('B13').result,115000);assert.equal(workbook.getWorksheet('Rekap Harian').getCell('G2').result,0);assert.equal(workbook.getWorksheet('Rekap Harian').getCell('F3').result,115000);
});
