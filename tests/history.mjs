import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jakartaMonth, transactionMonth, filterHistory, categorySummary, transactionsCsv } from '../src/history-utils.js';

const rows = [
  { id: '1', date: '27/10/2026', kind: 'income', title: 'Uang Saku', amount: 500000, category: 'Pemasukan', notes: 'Mingguan' },
  { id: '2', date: '27/10/2026', kind: 'expense', title: 'Makan Siang', amount: 20000, category: 'Makanan', notes: 'Kantin sekolah' },
  { id: '3', date: '26/10/2026', kind: 'expense', title: 'Bus', amount: 10000, category: 'Transportasi', notes: '' },
  { id: '4', date: '12/09/2026', kind: 'expense', title: 'Makan', amount: 30000, category: 'Makanan', notes: '' },
  { id: '5', date: '27/10/2026', kind: 'transfer', title: 'Tabungan Laptop', amount: 100000, category: 'Transfer ke Celengan', notes: '' },
];
test('month boundaries follow Jakarta, including year change', () => {
  assert.equal(jakartaMonth(new Date('2026-10-31T17:01:00Z')), '2026-11');
  assert.equal(jakartaMonth(new Date('2026-12-31T17:01:00Z')), '2027-01');
  assert.equal(transactionMonth('27/10/2026'), '2026-10');
  assert.equal(transactionMonth('invalid'), '');
});
test('history combines query, type and month without changing source data', () => {
  assert.deepEqual(filterHistory(rows, { query: ' KANTIN ', kind: 'expense', month: '2026-10' }).map(row => row.id), ['2']);
  assert.deepEqual(filterHistory(rows, { query: 'makanan' }).map(row => row.id), ['2', '4']);
  assert.equal(rows.length, 5);
  assert.equal(filterHistory(rows, { query: 'tidak ditemukan' }).length, 0);
});
test('category totals exclude income, transfers and other months', () => {
  const result = categorySummary(rows, '2026-10');
  assert.equal(result.total, 30000);
  assert.deepEqual(result.categories, [{ name: 'Makanan', amount: 20000, percent: 67 }, { name: 'Transportasi', amount: 10000, percent: 33 }]);
  assert.deepEqual(categorySummary([], '2026-10'), { total: 0, categories: [] });
});
test('CSV supports Indonesian text, commas, quotes and multiline notes', () => {
  const csv = transactionsCsv([{ ...rows[0], title: 'Hadiah, "Ibu"', notes: 'Baris 1\nBaris 2' }]);
  assert(csv.startsWith('\uFEFF"Tanggal"'));
  assert(csv.includes('"Hadiah, ""Ibu"""'));
  assert(csv.includes('"Baris 1\nBaris 2"'));
  assert(csv.includes('"500000"'));
});
test('CSV neutralizes spreadsheet formulas in untrusted names and notes', () => {
  const csv = transactionsCsv([{ ...rows[0], title: '=HYPERLINK("x")', notes: '  +1+1' }, { ...rows[1], title: '@SUM(1,2)', notes: '\tvalue' }]);
  assert(csv.includes('"\'=HYPERLINK(""x"")"'));
  assert(csv.includes('"\'  +1+1"'));
  assert(csv.includes('"\'@SUM(1,2)"'));
  assert(csv.includes('"\'\tvalue"'));
});
test('CSV includes exactly the filtered results and exports no other account data', () => {
  const csv = transactionsCsv(filterHistory(rows, { month: '2026-09' }));
  assert(csv.includes('12/09/2026'));
  assert(!csv.includes('27/10/2026'));
  assert(!csv.includes('Uang Saku'));
});
