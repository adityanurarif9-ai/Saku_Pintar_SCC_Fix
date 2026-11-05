import { shiftMonth, statistics } from './statistics-utils.js';

const DAY = 86400000;
export function parseReportDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}
export function reportMonthRange(month) {
  if (!parseReportDate(`${month}-01`)) throw new Error('Periode laporan tidak valid.');
  return { startDate: `${month}-01`, endDate: new Date(parseReportDate(`${shiftMonth(month, 1)}-01`).getTime() - DAY).toISOString().slice(0, 10) };
}
export function activityDate(item) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(item.date || '');
  return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
}
const impact = row => row.kind === 'income' ? row.amount : -row.amount;
export function schoolReport(activities, month, options = {}) {
  const defaults = reportMonthRange(month);
  const startDate = options.startDate ?? defaults.startDate, endDate = options.endDate ?? defaults.endDate;
  const start = parseReportDate(startDate), end = parseReportDate(endDate);
  if (!start || !end || end < start) throw new Error('Pilih tanggal mulai dan selesai yang valid.');
  const days = Math.round((end - start) / DAY) + 1;
  if (days > 366) throw new Error('Pilih periode laporan maksimal 366 hari.');
  const all = activities.map((item, index) => ({ ...item, iso: activityDate(item), sourceIndex: index }));
  if (all.some(row => !parseReportDate(row.iso) || !['income', 'expense', 'transfer'].includes(row.kind) || !Number.isSafeInteger(row.amount) || row.amount <= 0)) throw new Error('Ada transaksi yang tidak valid. Muat ulang dompet sebelum mengekspor.');
  // Snapshot is newest first, including the sequence of transactions on the same day.
  const rows = all.filter(row => row.iso >= startDate && row.iso <= endDate).sort((a, b) => a.iso.localeCompare(b.iso) || b.sourceIndex - a.sourceIndex);
  const recordedBalance = all.reduce((sum, row) => sum + impact(row), 0);
  const baseline = Number.isSafeInteger(options.currentBalance) ? options.currentBalance - recordedBalance : 0;
  const opening = baseline + all.filter(row => row.iso < startDate).reduce((sum, row) => sum + impact(row), 0);
  let balance = opening;
  const ledger = rows.map(row => ({ ...row, balance: (balance += impact(row)) }));
  const sum = kind => rows.filter(row => row.kind === kind).reduce((total, row) => total + row.amount, 0);
  const income = sum('income'), expense = sum('expense'), transfer = sum('transfer');
  const grouped = new Map();
  rows.forEach(row => { const entry = grouped.get(row.iso) || { income: 0, expense: 0, transfer: 0, count: 0 }; entry[row.kind] += row.amount; entry.count++; grouped.set(row.iso, entry); });
  const daily = Array.from({ length: days }, (_, index) => {
    const date = new Date(start.getTime() + index * DAY).toISOString().slice(0, 10);
    return { date, ...(grouped.get(date) || { income: 0, expense: 0, transfer: 0, count: 0 }) };
  });
  let dailyBalance = opening;
  daily.forEach(day => { day.balance = (dailyBalance += day.income - day.expense - day.transfer); });
  const categories = new Map();
  rows.filter(row => row.kind === 'expense').forEach(row => categories.set(row.category, (categories.get(row.category) || 0) + row.amount));
  return { startDate, endDate, days, rows: ledger, count: rows.length, opening, closing: balance, income, expense, transfer, net: income - expense, daily,
    categories: [...categories].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount),
    trend: statistics(activities, endDate.slice(0, 7)).trend,
  };
}
