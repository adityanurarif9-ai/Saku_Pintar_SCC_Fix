import React, { useEffect, useMemo, useRef, useState } from 'react';
import { reportMonthRange, schoolReport } from './school-report';
import { BusyLabel } from './Loading';
import './school-report.css';

export default function SchoolReportExport({ activities, month, studentName = '', currentBalance, onNotice }) {
  const [dates, setDates] = useState(() => reportMonthRange(month));
  const [identity, setIdentity] = useState({ studentName, className: '', studentNumber: '', school: '', reflection: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  useEffect(() => { setDates(reportMonthRange(month)); setError(''); }, [month]);
  const { preview, rangeError } = useMemo(() => {
    try { return { preview: schoolReport(activities, month, { ...dates, currentBalance }), rangeError: '' }; }
    catch (problem) { return { preview: null, rangeError: problem.message }; }
  }, [activities, month, dates, currentBalance]);
  function field(name, value) { setIdentity(previous => ({ ...previous, [name]: value })); }
  async function download(event) {
    event.preventDefault();
    if (lock.current || !preview?.count) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const { statisticsExcel } = await import('./statistics-export');
      const buffer = await statisticsExcel(activities, month, { ...dates, ...identity, currentBalance });
      const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a'); link.href = url; link.download = `SakuPintar-Rekap-${dates.startDate}_${dates.endDate}.xlsx`;
      document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
      onNotice('Laporan detail Excel siap diunduh.');
    } catch { setError('Laporan belum berhasil dibuat. Coba lagi setelah memeriksa koneksi.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <section className="school-export" aria-label="Ekspor laporan detail">
    <div className="school-export-title"><span className="excel-file-icon" aria-hidden="true">X</span><div><span className="school-export-tag">UNTUK CATATAN DAN TUGASMU</span><h3>Rekap keuangan lengkap</h3><p>Tanggal, keperluan, uang masuk dan keluar, sampai saldo berjalan.</p></div></div>
    <form onSubmit={download} aria-busy={busy}>
      <fieldset disabled={busy}><legend>Periode yang ingin dikumpulkan</legend><div className="school-export-grid"><label>Dari tanggal<input type="date" required value={dates.startDate} onInput={event => setDates(previous => ({ ...previous, startDate: event.target.value }))} onChange={event => setDates(previous => ({ ...previous, startDate: event.target.value }))}/></label><label>Sampai tanggal<input type="date" required min={dates.startDate} value={dates.endDate} onInput={event => setDates(previous => ({ ...previous, endDate: event.target.value }))} onChange={event => setDates(previous => ({ ...previous, endDate: event.target.value }))}/></label></div>
      <details><summary>Identitas siswa dan refleksi (opsional)</summary><div className="school-identity"><label>Nama siswa<input autoComplete="name" maxLength={80} value={identity.studentName} onChange={event => field('studentName', event.target.value)}/></label><div className="school-export-grid"><label>Kelas<input maxLength={40} placeholder="Contoh: X PPLG 1" value={identity.className} onChange={event => field('className', event.target.value)}/></label><label>Nomor absen<input type="text" inputMode="numeric" maxLength={10} placeholder="Contoh: 02" value={identity.studentNumber} onChange={event => field('studentNumber', event.target.value)}/></label></div><label>Sekolah<input maxLength={100} value={identity.school} onChange={event => field('school', event.target.value)}/></label><label>Refleksi pengelolaan uang<textarea maxLength={500} placeholder="Apa yang paling banyak menghabiskan uang? Apa rencana hematmu?" value={identity.reflection} onChange={event => field('reflection', event.target.value)}/></label></div></details>
      </fieldset>
      <p className="school-export-preview" role="status">{rangeError || (preview?.count ? `${preview.count} transaksi dalam ${preview.days} hari. Identitas dan refleksi hanya dimasukkan ke file unduhan.` : 'Belum ada transaksi pada tanggal pilihan. Ubah periode atau catat transaksi dahulu.')}</p>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="school-download" type="submit" disabled={busy || !preview?.count}>{busy ? <BusyLabel>Menyiapkan Excel…</BusyLabel> : 'Unduh laporan detail (.xlsx)'}</button>
      <p className="school-export-note">5 lembar: Ringkasan, Transaksi, Rekap Harian, Kategori, dan Tren 6 Bulan. File memuat nominal lengkap, termasuk saat nominal di aplikasi disembunyikan.</p>
    </form>
  </section>;
}

