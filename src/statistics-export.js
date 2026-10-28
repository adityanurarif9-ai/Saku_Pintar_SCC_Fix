import { statistics } from './statistics-utils.js';
import { monthLabel } from './history-utils.js';

const currency = '"Rp" #,##0;[Red]-"Rp" #,##0';
function text(value) {
  // Force user content to plain text, including values beginning with =, + or @.
  return String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').slice(0, 32767);
}
function heading(sheet, cells) {
  const row = sheet.addRow(cells);
  row.height = 26;
  row.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF275FF0' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle' };
  });
  return row.number;
}
function sheet(workbook, name, widths) {
  const result = workbook.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] });
  result.columns = widths.map(width => ({ width }));
  result.properties.defaultRowHeight = 22;
  return result;
}
export async function buildStatisticsWorkbook(activities, month) {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SakuPintar';
  const report = statistics(activities, month);
  const summary = sheet(workbook, 'Ringkasan', [37, 35]);
  heading(summary, ['SakuPintar · Laporan Bulanan', monthLabel(month)]);
  summary.addRows([
    ['Total pemasukan', report.income], ['Total pengeluaran', report.expense],
    ['Selisih pemasukan - pengeluaran', report.net], ['Transfer ke tabungan', report.transfer],
    ['Jumlah transaksi', report.count], ['Rata-rata pengeluaran / hari kalender', report.dailyAverage],
    ['Jumlah hari kalender', report.days], ['Pengeluaran bulan sebelumnya', report.previous.expense],
    ['Catatan', 'Transfer tabungan tidak dihitung sebagai pengeluaran. Selisih bukan saldo akhir.'],
    ['Cakupan', 'Transaksi dan kategori mengikuti bulan pilihan. Tren mencakup 6 bulan hingga bulan pilihan.'],
  ]);
  [2, 3, 4, 5, 7, 9].forEach(row => { summary.getCell(row, 2).numFmt = currency; });
  summary.getRow(10).height = 48; summary.getRow(11).height = 48;
  summary.getCell('B10').alignment = summary.getCell('B11').alignment = { wrapText: true, vertical: 'top' };
  const transactions = sheet(workbook, 'Transaksi', [16, 32, 23, 24, 22, 48]);
  heading(transactions, ['Tanggal', 'Nama', 'Jenis', 'Kategori', 'Nominal (Rp)', 'Catatan']);
  const kinds = { income: 'Pemasukan', expense: 'Pengeluaran', transfer: 'Transfer Tabungan' };
  const ordered = [...report.rows].sort((a, b) => a.date.split('/').reverse().join('').localeCompare(b.date.split('/').reverse().join('')));
  for (const item of ordered) transactions.addRow([text(item.date), text(item.title), kinds[item.kind] || text(item.kind), text(item.category), item.amount, text(item.notes)]);
  transactions.getColumn(5).numFmt = currency;
  transactions.getColumn(6).alignment = { wrapText: true, vertical: 'top' };
  transactions.autoFilter = { from: 'A1', to: `F${Math.max(1, transactions.rowCount)}` };
  const categories = sheet(workbook, 'Kategori', [29, 24, 19]);
  heading(categories, ['Kategori pengeluaran', 'Nominal (Rp)', 'Porsi']);
  for (const item of report.categories) categories.addRow([text(item.name), item.amount, item.amount / report.expense]);
  categories.getColumn(2).numFmt = currency; categories.getColumn(3).numFmt = '0.0%';
  const trend = sheet(workbook, 'Tren 6 Bulan', [24, 24, 24, 24, 24]);
  heading(trend, ['Bulan', 'Pemasukan', 'Pengeluaran', 'Selisih', 'Transfer Tabungan']);
  for (const item of report.trend) trend.addRow([monthLabel(item.month), item.income, item.expense, item.net, item.transfer]);
  [2, 3, 4, 5].forEach(column => { trend.getColumn(column).numFmt = currency; });
  return workbook;
}
export async function statisticsExcel(activities, month) {
  const workbook = await buildStatisticsWorkbook(activities, month);
  return workbook.xlsx.writeBuffer();
}
