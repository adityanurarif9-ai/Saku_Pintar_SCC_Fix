import { categorySummary, jakartaMonth, transactionMonth } from './history-utils.js';

export function shiftMonth(month, offset) {
  const [year, number] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, number - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}
export function availableMonths(activities, current = jakartaMonth()) {
  return [...new Set([current, ...activities.map(item => transactionMonth(item.date)).filter(Boolean)])].sort().reverse();
}
export function monthlyTotals(activities, month) {
  const rows = activities.filter(item => transactionMonth(item.date) === month);
  const sum = kind => rows.filter(item => item.kind === kind).reduce((total, item) => total + item.amount, 0);
  const income = sum('income'), expense = sum('expense'), transfer = sum('transfer');
  return { month, rows, count: rows.length, income, expense, transfer, net: income - expense };
}
export function statistics(activities, month) {
  const current = monthlyTotals(activities, month);
  const previous = monthlyTotals(activities, shiftMonth(month, -1));
  const [year, number] = month.split('-').map(Number);
  const days = new Date(Date.UTC(year, number, 0)).getUTCDate();
  return { ...current, previous, days, dailyAverage: Math.round(current.expense / days),
    expenseChange: previous.expense ? (current.expense - previous.expense) / previous.expense * 100 : null,
    categories: categorySummary(activities, month).categories.map(category => ({ ...category, percent: Math.round(category.amount / current.expense * 1000) / 10 })),
    trend: Array.from({ length: 6 }, (_, index) => monthlyTotals(activities, shiftMonth(month, index - 5))),
  };
}
