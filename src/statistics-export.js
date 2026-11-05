import { monthLabel } from './history-utils.js';
import { schoolReport, parseReportDate } from './school-report.js';

const currency = '"Rp" #,##0;[Red]-"Rp" #,##0';
const kinds = { income: 'Pemasukan', expense: 'Pengeluaran', transfer: 'Transfer Tabungan' };
const dayName = iso => new Intl.DateTimeFormat('id-ID', { weekday: 'long', timeZone: 'UTC' }).format(parseReportDate(iso));
function text(value) {
  // ExcelJS string values remain literal text, including formulas, links, and leading zeroes.
  return String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').slice(0, 32767);
}
function formula(sheet, cell, expression, result) { sheet.getCell(cell).value = { formula: expression, result }; }
function heading(sheet, cells) {
  const row = sheet.addRow(cells); row.height = 32;
  row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF275FF0' } }; cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }; cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; });
  return row.number;
}
function sheet(workbook, name, widths) {
  const result = workbook.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1, showGridLines: false }], pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '1:1' } });
  result.columns = widths.map(width => ({ width })); result.properties.defaultRowHeight = 24;
  result.headerFooter.oddFooter = '&LSakuPintar&C&P / &N';
  return result;
}
function finish(sheet) {
  sheet.eachRow((row, index) => {
    if (index === 1) return;
    row.eachCell(cell => {
      cell.font = { name: 'Arial', size: 10, color: { argb: cell.type === 6 ? 'FF101A30' : 'FF23486A' } };
      cell.alignment = { vertical: 'middle', wrapText: true };
      if (index % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F6FC' } };
    });
  });
  sheet.pageSetup.printArea = `A1:${sheet.getColumn(sheet.columnCount).letter}${sheet.rowCount}`;
}

export async function buildStatisticsWorkbook(activities, month, options = {}) {
  const { default: ExcelJS } = await import('exceljs');
  const report = schoolReport(activities, month, options);
  const workbook = new ExcelJS.Workbook(); workbook.creator = 'SakuPintar';
  workbook.calcProperties.fullCalcOnLoad = true;
  const summary = sheet(workbook, 'Ringkasan', [43, 76]);
  heading(summary, ['SakuPintar', 'Laporan Pemasukan dan Pengeluaran']);
  summary.addRows([
    ['Nama siswa', text(options.studentName)], ['Kelas', text(options.className)],
    ['Nomor absen', text(options.studentNumber)], ['Sekolah', text(options.school)],
    ['Tanggal mulai', parseReportDate(report.startDate)], ['Tanggal selesai', parseReportDate(report.endDate)],
    ['Saldo awal periode', report.opening], ['Total pemasukan', null], ['Total pengeluaran', null],
    ['Selisih pemasukan - pengeluaran', null], ['Transfer ke celengan', null], ['Saldo akhir periode', null],
    ['Jumlah transaksi', report.count], ['Jumlah hari periode', report.days], ['Rata-rata pengeluaran / hari kalender', null],
    ['Pengeluaran terbesar', report.rows.filter(row => row.kind === 'expense').reduce((max, row) => Math.max(max, row.amount), 0)],
    ['Kategori pengeluaran terbesar', report.categories[0]?.name || 'Belum ada pengeluaran'],
    ['Refleksi siswa', text(options.reflection)],
    ['Cara membaca saldo', 'Saldo akhir = saldo awal + pemasukan - pengeluaran - transfer celengan. Saldo awal memakai riwayat sebelum periode dan saldo dompet saat ekspor.'],
    ['Cakupan laporan', 'Transaksi, Rekap Harian, dan Kategori mengikuti tanggal pilihan. Hari tanpa transaksi tetap ditampilkan; Rp0 berarti tidak ada transaksi tercatat, bukan kepastian tidak berbelanja.'],
    ['Tren', `Enam bulan sampai ${monthLabel(report.endDate.slice(0, 7))}. Tren menggunakan bulan penuh, termasuk transaksi di luar tanggal pilihan.`],
    ['Dibuat pada', new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'long', timeStyle: 'short' }).format(new Date()) + ' WIB'],
  ]);
  ['B6', 'B7'].forEach(cell => { summary.getCell(cell).numFmt = 'dd/mm/yyyy'; });
  [8,9,10,11,12,13,16,17].forEach(row => { summary.getCell(row, 2).numFmt = currency; });
  [19,20,21,22].forEach(row => { summary.getRow(row).height = row === 19 ? 110 : 52; });
  summary.getRow(19).height = Math.max(46, Math.ceil(text(options.reflection).length / 65) * 15 + 12, text(options.reflection).split('\n').length * 15 + 12);
  summary.views = [{ showGridLines: false }];

  const transactions = sheet(workbook, 'Transaksi', [6, 15, 13, 22, 34, 22, 21, 21, 21, 22, 50]);
  heading(transactions, ['No.', 'Tanggal', 'Hari', 'Jenis', 'Keperluan / sumber uang', 'Kategori', 'Pemasukan (Rp)', 'Pengeluaran (Rp)', 'Ke celengan (Rp)', 'Saldo berjalan (Rp)', 'Catatan']);
  for (const [index, item] of report.rows.entries()) {
    const row = transactions.addRow([index + 1, parseReportDate(item.iso), dayName(item.iso), kinds[item.kind], text(item.title), text(item.category), item.kind === 'income' ? item.amount : 0, item.kind === 'expense' ? item.amount : 0, item.kind === 'transfer' ? item.amount : 0, null, text(item.notes)]);
    formula(transactions, `J${row.number}`, `${index ? `J${row.number - 1}` : "'Ringkasan'!$B$8"}+G${row.number}-H${row.number}-I${row.number}`, item.balance);
    row.height = Math.max(30, Math.ceil(text(item.notes).length / 44) * 15 + 10, Math.ceil(text(item.title).length / 30) * 15 + 10, text(item.notes).split('\n').length * 15 + 10);
  }
  const last = Math.max(2, report.rows.length + 1);
  if (!report.rows.length) transactions.addRow([null, null, null, null, 'Belum ada transaksi dalam periode ini.']);
  transactions.getColumn(2).numFmt = 'dd/mm/yyyy';
  [7,8,9,10].forEach(column => { transactions.getColumn(column).numFmt = currency; });
  if (report.rows.length) transactions.autoFilter = { from: 'A1', to: `K${report.rows.length + 1}` };
  transactions.pageSetup.paperSize = 8;
  transactions.views = [{ state: 'frozen', ySplit: 1, xSplit: 2, showGridLines: false }];
  for (const [cell, column, total] of [['B9','G',report.income],['B10','H',report.expense],['B12','I',report.transfer]]) formula(summary, cell, `SUM('Transaksi'!${column}2:${column}${last})`, total);
  formula(summary, 'B11', 'B9-B10', report.net);
  formula(summary, 'B13', 'B8+B9-B10-B12', report.closing);
  formula(summary, 'B16', 'ROUND(B10/B15,0)', Math.round(report.expense / report.days));
  formula(summary, 'B14', `COUNT('Transaksi'!A2:A${last})`, report.count);
  formula(summary, 'B15', 'B7-B6+1', report.days);
  formula(summary, 'B17', `MAX('Transaksi'!H2:H${last})`, report.rows.filter(row => row.kind === 'expense').reduce((max, row) => Math.max(max, row.amount), 0));

  const daily = sheet(workbook, 'Rekap Harian', [15, 13, 22, 22, 22, 23, 20]);
  heading(daily, ['Tanggal', 'Hari', 'Pemasukan (Rp)', 'Pengeluaran (Rp)', 'Ke celengan (Rp)', 'Saldo akhir hari (Rp)', 'Jumlah transaksi']);
  for (const [index, item] of report.daily.entries()) {
    const n = daily.addRow([parseReportDate(item.date), dayName(item.date)]).number;
    for (const [col, source, value] of [['C','G',item.income],['D','H',item.expense],['E','I',item.transfer]]) formula(daily, `${col}${n}`, `SUMIFS('Transaksi'!$${source}$2:$${source}$${last},'Transaksi'!$B$2:$B$${last},A${n})`, value);
    formula(daily, `F${n}`, `${index ? `F${n - 1}` : "'Ringkasan'!$B$8"}+C${n}-D${n}-E${n}`, item.balance);
    formula(daily, `G${n}`, `COUNTIFS('Transaksi'!$B$2:$B$${last},A${n})`, item.count);
  }
  daily.getColumn(1).numFmt = 'dd/mm/yyyy'; [3,4,5,6].forEach(col => { daily.getColumn(col).numFmt = currency; });
  daily.autoFilter = { from: 'A1', to: `G${daily.rowCount}` };

  const categories = sheet(workbook, 'Kategori', [30, 24, 18]);
  heading(categories, ['Kategori pengeluaran', 'Nominal (Rp)', 'Porsi']);
  for (const item of report.categories) {
    const n = categories.addRow([text(item.name)]).number;
    formula(categories, `B${n}`, `SUMIFS('Transaksi'!$H$2:$H$${last},'Transaksi'!$F$2:$F$${last},SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(A${n},"~","~~"),"*","~*"),"?","~?"))`, item.amount);
    formula(categories, `C${n}`, `IF('Ringkasan'!$B$10=0,0,B${n}/'Ringkasan'!$B$10)`, item.amount / report.expense);
  }
  if (!report.categories.length) categories.addRow(['Belum ada pengeluaran', 0, 0]);
  categories.getColumn(2).numFmt = currency; categories.getColumn(3).numFmt = '0.0%';
  const trend = sheet(workbook, 'Tren 6 Bulan', [25, 24, 24, 24, 24]);
  heading(trend, ['Bulan', 'Pemasukan', 'Pengeluaran', 'Selisih', 'Transfer Tabungan']);
  for (const item of report.trend) { const n = trend.addRow([monthLabel(item.month), item.income, item.expense, null, item.transfer]).number; formula(trend, `D${n}`, `B${n}-C${n}`, item.net); }
  [2,3,4,5].forEach(column => { trend.getColumn(column).numFmt = currency; });
  workbook.worksheets.forEach(finish);
  return workbook;
}
export async function statisticsExcel(activities, month, options = {}) {
  const workbook = await buildStatisticsWorkbook(activities, month, options);
  return workbook.xlsx.writeBuffer();
}
