import React, { useMemo, useRef, useState } from 'react';
import { availableMonths, statistics } from './statistics-utils';
import { jakartaMonth, monthLabel } from './history-utils';
import { BusyLabel } from './Loading';

const palette = ['#2863ff', '#15a77e', '#f6b83e', '#9963d8', '#eb6c87', '#49a4c4'];
function ChartIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 3v18h17M8 16v-4m5 4V7m5 9v-7"/></svg>; }
function Trend({ rows, money }) {
  const highest = Math.max(1, ...rows.flatMap(row => [row.income, row.expense]));
  const [selected, setSelected] = useState(rows.at(-1).month);
  const active = rows.find(row => row.month === selected) || rows.at(-1);
  return <section className="stats-card"><div className="stats-card-heading"><div><h3>Arus uang</h3><p>6 bulan sampai periode pilihan</p></div><span className="stats-icon"><ChartIcon/></span></div>
    <div className="chart-legend"><span><i className="legend-income"/>Masuk</span><span><i className="legend-expense"/>Keluar</span></div>
    <div className="flow-chart" role="group" aria-label="Grafik arus uang 6 bulan">{rows.map(row => <button key={row.month} className={`flow-month${active.month === row.month ? ' selected' : ''}`} onClick={() => setSelected(row.month)} aria-label={`${monthLabel(row.month)}: masuk ${money(row.income)}, keluar ${money(row.expense)}`} aria-pressed={active.month === row.month}><span className="flow-bars" aria-hidden="true"><i className="income-bar" style={{ height: `${row.income / highest * 100}%`, minHeight: row.income ? 3 : 0 }}/><i className="expense-bar" style={{ height: `${row.expense / highest * 100}%`, minHeight: row.expense ? 3 : 0 }}/></span><span>{new Intl.DateTimeFormat('id-ID', { month: 'short', timeZone: 'UTC' }).format(new Date(`${row.month}-01T00:00:00Z`))}</span></button>)}</div>
    <div className="chart-detail" aria-live="polite"><strong>{monthLabel(active.month)}</strong><div><span>Masuk <b className="green">{money(active.income)}</b></span><span>Keluar <b className="red">{money(active.expense)}</b></span></div></div><p className="stats-footnote">Ketuk batang bulan untuk melihat nominalnya.</p>
  </section>;
}
function Categories({ report, money }) {
  let offset = 0;
  return <section className="stats-card"><div className="stats-card-heading"><div><h3>Pengeluaran untuk apa?</h3><p>Porsi kategori pada bulan pilihan</p></div></div>
    {!report.categories.length ? <p className="stats-empty">Belum ada pengeluaran pada periode ini. Catat pengeluaranmu untuk melihat pembagiannya.</p> : <>
      <div className="category-donut"><svg viewBox="0 0 160 160" role="img" aria-label="Diagram porsi pengeluaran per kategori"><circle cx="80" cy="80" r="62" fill="none" stroke="#edf1f8" strokeWidth="18"/>{report.categories.map((category, index) => { const percent = category.amount / report.expense * 100; const start = offset; offset += percent; return <circle key={category.name} cx="80" cy="80" r="62" fill="none" stroke={palette[index % palette.length]} strokeWidth="18" pathLength="100" strokeDasharray={`${percent} ${100 - percent}`} strokeDashoffset={-start} transform="rotate(-90 80 80)"/>; })}</svg><div><span>Total keluar</span><strong>{money(report.expense)}</strong><small>{report.categories.length} kategori</small></div></div>
      <div className="stats-category-list">{report.categories.map((category, index) => <div key={category.name}><i style={{ background: palette[index % palette.length] }}/><span>{category.name}<small>{category.percent.toLocaleString('id-ID')}% dari pengeluaran</small></span><strong>{money(category.amount)}</strong></div>)}</div>
    </>}
  </section>;
}
export default function Statistics({ activities, money, hidden, onToggleHidden, onNotice }) {
  const [month, setMonth] = useState(jakartaMonth());
  const [exporting, setExporting] = useState(false);
  const lock = useRef(false);
  const months = availableMonths(activities);
  const report = useMemo(() => statistics(activities, month), [activities, month]);
  async function exportExcel() {
    if (lock.current || !report.count) return;
    lock.current = true; setExporting(true);
    try {
      const { statisticsExcel } = await import('./statistics-export');
      const buffer = await statisticsExcel(activities, month);
      const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a'); link.href = url; link.download = `SakuPintar-Statistik-${month}.xlsx`;
      document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
      onNotice('Laporan Excel disiapkan untuk diunduh.');
    } catch { onNotice('Laporan belum berhasil dibuat. Periksa koneksi dan coba lagi.'); }
    finally { lock.current = false; setExporting(false); }
  }
  const change = report.expenseChange;
  return <section className="statistics-page">
    <div className="stats-title"><span className="stats-page-icon"><ChartIcon/></span><div><h2>Statistik</h2><p>Kenali arah uangmu, bulan demi bulan.</p></div></div>
    <label className="stats-period">Periode laporan<select aria-label="Periode statistik" value={month} onChange={event => setMonth(event.target.value)} disabled={exporting}>{months.map(value => <option value={value} key={value}>{monthLabel(value)}</option>)}</select></label>
    <section className="stats-hero"><div><span>SELISIH ARUS KAS</span><button onClick={onToggleHidden} aria-label={hidden ? 'Tampilkan nominal statistik' : 'Sembunyikan nominal statistik'}>{hidden ? 'Tampilkan' : 'Sembunyikan'}</button></div><strong>{money(report.net)}</strong><p>Pemasukan dikurangi pengeluaran</p><span className="stats-status">{!report.count ? 'Belum ada transaksi bulan ini' : report.net > 0 ? 'Pemasukan lebih besar dari pengeluaran' : report.net < 0 ? 'Pengeluaran lebih besar dari pemasukan' : 'Pemasukan dan pengeluaran seimbang'}</span></section>
    <div className="stats-totals"><article><span className="stats-total-icon green">↙</span><p>Pemasukan</p><strong>{money(report.income)}</strong></article><article><span className="stats-total-icon red">↗</span><p>Pengeluaran</p><strong>{money(report.expense)}</strong></article></div>
    <div className={`stats-comparison${change !== null && change <= 0 ? ' comparison-down' : ''}`}><span aria-hidden="true">{change === null ? '↔' : change <= 0 ? '↘' : '↗'}</span><p>{change === null ? 'Belum ada pengeluaran bulan lalu sebagai pembanding.' : change === 0 ? 'Pengeluaran sama dengan total bulan lalu.' : <>Pengeluaran <strong>{Math.abs(change).toLocaleString('id-ID', { maximumFractionDigits: 1 })}% {change < 0 ? 'lebih rendah' : 'lebih tinggi'}</strong> dibanding total bulan lalu.</>}<small>{month === jakartaMonth() ? 'Bulan ini masih berjalan. ' : ''}Transfer ke celengan tidak dihitung sebagai pengeluaran.</small></p></div>
    {!report.count && <div className="stats-empty-banner">Belum ada transaksi di {monthLabel(month)}. Pilih bulan lain atau mulai mencatat uang masuk dan keluar.</div>}
    <Trend key={month} rows={report.trend} money={money}/>
    <Categories report={report} money={money}/>
    <section className="stats-card stats-details"><h3>Sekilas periode ini</h3><div><span>Rata-rata keluar / hari<small>Total pengeluaran dibagi {report.days} hari kalender</small></span><strong>{money(report.dailyAverage)}</strong></div><div><span>Disisihkan ke celengan<small>Transfer dan setoran awal target</small></span><strong>{money(report.transfer)}</strong></div><div><span>Transaksi tercatat<small>Masuk, keluar, dan transfer</small></span><strong>{report.count}</strong></div><p className="stats-footnote">Selisih arus kas bukan saldo akhir dompet dan tidak mengurangi transfer tabungan.</p></section>
    <section className="stats-export"><span className="excel-file-icon" aria-hidden="true">X</span><div><h3>Simpan laporanmu</h3><p>File Excel berisi ringkasan, transaksi, kategori, dan tren 6 bulan.</p></div><button disabled={exporting || !report.count} onClick={exportExcel}>{exporting ? <BusyLabel>Menyiapkan Excel…</BusyLabel> : 'Unduh Excel (.xlsx)'}</button><small>Transaksi mengikuti periode pilihan. File memuat nominal lengkap, termasuk saat tampilan disembunyikan.</small></section>
  </section>;
}
