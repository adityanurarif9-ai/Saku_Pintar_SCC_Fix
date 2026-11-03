import React, { useMemo, useState } from 'react';
import { filterHistory, monthLabel, transactionMonth } from './history-utils';
import { historyTotals, sortTransactions } from './budget-utils';

export function ActivityList({ activities, money, showNotes = false, emptyMessage = 'Belum ada transaksi.' }) {
  return <div className="activity-list">{activities.map(item => <article className="activity" key={item.id}><div><h3>{item.title}</h3><p>{item.date} • {item.category}</p>{showNotes && item.notes && <p className="activity-note">{item.notes}</p>}</div><strong className={item.kind === 'income' ? 'green' : item.kind === 'expense' ? 'red' : 'blue'}>{item.kind === 'income' ? '+' : '-'}{money(item.amount)}</strong></article>)}{!activities.length && <p className="empty-state">{emptyMessage}</p>}</div>;
}

export default function History({ activities, money }) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [month, setMonth] = useState('all');
  const [order, setOrder] = useState('newest');
  const months = useMemo(() => [...new Set(activities.map(item => transactionMonth(item.date)).filter(Boolean))].sort().reverse(), [activities]);
  const filtered = sortTransactions(filterHistory(activities, { query, kind, month }), order);
  const totals = historyTotals(filtered);
  return <section className="history-section"><div className="section-heading"><h2>Riwayat Transaksi</h2></div>
    <div className="history-filters"><label className="sr-only" htmlFor="history-search">Cari transaksi</label><input id="history-search" type="search" placeholder="Cari nama, kategori, atau catatan…" value={query} onChange={event => setQuery(event.target.value)} />
      <label className="month-filter">Periode<select value={month} onChange={event => setMonth(event.target.value)}><option value="all">Semua bulan</option>{months.map(value => <option value={value} key={value}>{monthLabel(value)}</option>)}</select></label>
      <div className="filter-chips" aria-label="Jenis transaksi">{[['all', 'Semua'], ['income', 'Masuk'], ['expense', 'Keluar'], ['transfer', 'Tabungan']].map(([value, label]) => <button key={value} aria-pressed={kind === value} className={kind === value ? 'selected' : ''} onClick={() => setKind(value)}>{label}</button>)}</div>
    </div><p className="result-count" role="status">{filtered.length} transaksi{filtered.length !== activities.length ? ` dari ${activities.length}` : ''}</p>
    <div className="history-overview" aria-label="Total hasil filter"><div><span>Masuk</span><strong className="green">{money(totals.income)}</strong></div><div><span>Keluar</span><strong className="red">{money(totals.expense)}</strong></div><div><span>Ke celengan</span><strong className="blue">{money(totals.transfer)}</strong></div></div>
    <div className="history-sort"><label>Urutkan<select value={order} onChange={event => setOrder(event.target.value)}><option value="newest">Terbaru</option><option value="oldest">Terlama</option><option value="largest">Nominal terbesar</option></select></label>{(query || kind !== 'all' || month !== 'all') && <button onClick={() => { setQuery(''); setKind('all'); setMonth('all'); }}>Reset filter</button>}</div>
    <ActivityList activities={filtered} money={money} showNotes emptyMessage={activities.length ? 'Tidak ada transaksi yang sesuai. Coba ubah pencarian atau filter.' : 'Belum ada transaksi. Tambahkan saldo pertamamu.'} />
  </section>;
}
