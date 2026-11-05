import React, { useState } from 'react';
import { budgetSummary } from './budget-utils';
import { readPreferences, savePreference } from './preferences';
import SpendingCoach from './SpendingCoach';

export default function BudgetCard({ userId, activities, money }) {
  const [limit, setLimit] = useState(() => readPreferences(userId).monthlyBudget || 0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const report = budgetSummary(activities, limit);
  function save(event) {
    event.preventDefault();
    const amount = Number(draft);
    if (!Number.isSafeInteger(amount) || amount < 1000) return setError('Masukkan anggaran minimal Rp1.000, tanpa titik atau koma.');
    if (!savePreference(userId, 'monthlyBudget', amount)) return setError('Pengaturan belum tersimpan. Izinkan penyimpanan browser lalu coba lagi.');
    setLimit(amount); setEditing(false); setError('');
  }
  return <><section className={`budget-card${report.valid && report.percent >= 80 ? ' budget-warning' : ''}`} aria-label="Anggaran bulanan">
    <div className="section-heading"><div><span className="budget-kicker">RENCANA BULAN INI</span><h2>Jaga pengeluaranmu</h2></div><button aria-expanded={editing} onClick={() => { setEditing(!editing); setDraft(String(limit || '')); setError(''); }}>{editing ? 'Batal' : report.valid ? 'Atur' : '+ Atur batas'}</button></div>
    {editing ? <form className="budget-form" onSubmit={save}><label htmlFor="monthly-budget">Batas pengeluaran bulanan (Rp)</label><div><input id="monthly-budget" type="number" inputMode="numeric" min="1000" step="1" required value={draft} placeholder="Contoh: 1000000" onChange={event => setDraft(event.target.value)}/><button type="submit">Simpan</button></div>{error && <p role="alert">{error}</p>}</form> : report.valid ? <>
      <div className="budget-amount"><strong>{money(report.spent)}</strong><span>dari {money(limit)}</span></div>
      <div className="budget-track" role="progressbar" aria-label="Anggaran terpakai" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, report.percent)} aria-valuetext={`${report.percent}% anggaran terpakai`}><span style={{ width: `${Math.min(100, report.percent)}%` }}/></div>
      <p className="budget-status">{report.over ? `Melebihi batas ${money(report.over)}. Tinjau pengeluaran sebelum belanja lagi.` : report.percent >= 100 ? 'Batas bulan ini sudah terpakai.' : <>Sisa <strong>{money(report.remaining)}</strong> · {report.percent}% terpakai</>}</p>
      <div className="budget-daily"><span>Alokasi rata-rata tersisa<strong>{money(report.daily)} / hari</strong></span><span>{report.daysLeft} hari<br/>termasuk hari ini</span></div>
    </> : <p className="budget-intro">Tentukan batas bulanan agar kamu tahu kapan harus mengurangi belanja. Transfer celengan tidak dihitung sebagai pengeluaran.</p>}
    <p className="budget-local">Batas berlaku setiap bulan, tersimpan untuk akunmu di perangkat ini. Alokasi harian bukan saldo dompet.</p>
  </section><SpendingCoach activities={activities} limit={limit} userId={userId} money={money}/></>;
}
