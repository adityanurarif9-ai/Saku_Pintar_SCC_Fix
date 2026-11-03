import { jakartaMonth, transactionMonth } from './history-utils.js';

export function budgetSummary(activities, limit, now = new Date()) {
  const month = jakartaMonth(now);
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Jakarta', day: '2-digit' }).formatToParts(now).map(p => [p.type, p.value]));
  const [year, number] = month.split('-').map(Number);
  const daysLeft = new Date(Date.UTC(year, number, 0)).getUTCDate() - Number(parts.day) + 1;
  const spent = activities.filter(row => row.kind === 'expense' && transactionMonth(row.date) === month).reduce((sum, row) => sum + row.amount, 0);
  const valid = Number.isSafeInteger(limit) && limit > 0;
  const remaining = valid ? Math.max(0, limit - spent) : 0;
  return { spent, remaining, daysLeft, daily: Math.floor(remaining / daysLeft), percent: valid ? Math.round(spent / limit * 100) : 0, over: valid ? Math.max(0, spent - limit) : 0, valid };
}

export function historyTotals(rows) {
  return rows.reduce((total, row) => { if (Object.hasOwn(total, row.kind)) total[row.kind] += row.amount; return total; }, { income: 0, expense: 0, transfer: 0 });
}

export function sortTransactions(rows, order) {
  const dateKey = row => (row.date || '').split('/').reverse().join('');
  return [...rows].sort((a, b) => order === 'largest' ? b.amount - a.amount : order === 'oldest' ? dateKey(a).localeCompare(dateKey(b)) : dateKey(b).localeCompare(dateKey(a)));
}
