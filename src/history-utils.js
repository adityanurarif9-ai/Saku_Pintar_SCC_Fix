export function jakartaMonth(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit' }).formatToParts(now).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}`;
}
export function transactionMonth(date) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date || '');
  return match ? `${match[3]}-${match[2]}` : '';
}
export function monthLabel(month) {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T00:00:00Z`));
}
export function filterHistory(activities, { query = '', kind = 'all', month = 'all' } = {}) {
  const search = query.trim().toLocaleLowerCase('id-ID');
  return activities.filter(item => (kind === 'all' || item.kind === kind) && (month === 'all' || transactionMonth(item.date) === month) && (!search || `${item.title} ${item.category} ${item.notes || ''}`.toLocaleLowerCase('id-ID').includes(search)));
}
export function categorySummary(activities, month = jakartaMonth()) {
  const totals = new Map();
  for (const item of activities) {
    if (item.kind !== 'expense' || transactionMonth(item.date) !== month) continue;
    totals.set(item.category, (totals.get(item.category) || 0) + item.amount);
  }
  const total = [...totals.values()].reduce((sum, amount) => sum + amount, 0);
  return { total, categories: [...totals.entries()].map(([name, amount]) => ({ name, amount, percent: total ? Math.round(amount / total * 100) : 0 })).sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name)) };
}
function csvCell(value) {
  let text = String(value ?? '');
  // Spreadsheet programs can interpret imported text as formulas, even inside quotes.
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function transactionsCsv(activities) {
  const labels = { income: 'Pemasukan', expense: 'Pengeluaran', transfer: 'Transfer Tabungan' };
  const rows = [['Tanggal', 'Nama', 'Jenis', 'Kategori', 'Nominal (Rp)', 'Catatan'], ...activities.map(item => [item.date, item.title, labels[item.kind] || item.kind, item.category, item.amount, item.notes || ''])];
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
}
