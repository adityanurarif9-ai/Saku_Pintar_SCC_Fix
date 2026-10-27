import React, { useMemo, useState } from 'react';
import { filterHistory, monthLabel, transactionMonth, transactionsCsv } from './history-utils';

export function ActivityList({ activities, money, showNotes = false, emptyMessage = 'Belum ada transaksi.' }) {
  return <div className="activity-list">{activities.map(item => <article className="activity" key={item.id}><div><h3>{item.title}</h3><p>{item.date} • {item.category}</p>{showNotes && item.notes && <p className="activity-note">{item.notes}</p>}</div><strong className={item.kind === 'income' ? 'green' : item.kind === 'expense' ? 'red' : 'blue'}>{item.kind === 'income' ? '+' : '-'}{money(item.amount)}</strong></article>)}{!activities.length && <p className="empty-state">{emptyMessage}</p>}</div>;
}

export default function History({ activities, money, onNotice }) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [month, setMonth] = useState('all');
  const months = useMemo(() => [...new Set(activities.map(item => transactionMonth(item.date)).filter(Boolean))].sort().reverse(), [activities]);
  const filtered = filterHistory(activities, { query, kind, month });
  function exportCsv() {
    try {
      const url = URL.createObjectURL(new Blob([transactionsCsv(filtered)], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url; link.download = `SakuPintar-riwayat-${month === 'all' ? 'semua' : month}.csv`;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      onNotice('File CSV disiapkan untuk diunduh. Nominal lengkap ada di dalam file.');
    } catch { onNotice('File belum berhasil dibuat. Coba lagi.'); }
  }
  return <section className="history-section"><div className="section-heading"><h2>Riwayat Transaksi</h2><button onClick={exportCsv} disabled={!filtered.length}>Ekspor CSV</button></div>
    <div className="history-filters"><label className="sr-only" htmlFor="history-search">Cari transaksi</label><input id="history-search" type="search" placeholder="Cari nama, kategori, atau catatan…" value={query} onChange={event => setQuery(event.target.value)} />
      <label className="month-filter">Periode<select value={month} onChange={event => setMonth(event.target.value)}><option value="all">Semua bulan</option>{months.map(value => <option value={value} key={value}>{monthLabel(value)}</option>)}</select></label>
      <div className="filter-chips" aria-label="Jenis transaksi">{[['all', 'Semua'], ['income', 'Masuk'], ['expense', 'Keluar'], ['transfer', 'Tabungan']].map(([value, label]) => <button key={value} aria-pressed={kind === value} className={kind === value ? 'selected' : ''} onClick={() => setKind(value)}>{label}</button>)}</div>
    </div><p className="result-count" role="status">{filtered.length} transaksi{filtered.length !== activities.length ? ` dari ${activities.length}` : ''}</p><p className="export-hint">CSV mengikuti filter dan memuat nominal lengkap.</p>
    <ActivityList activities={filtered} money={money} showNotes emptyMessage={activities.length ? 'Tidak ada transaksi yang sesuai. Coba ubah pencarian atau filter.' : 'Belum ada transaksi. Tambahkan saldo pertamamu.'} />
  </section>;
}
