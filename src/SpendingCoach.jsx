import React, { useMemo, useState } from 'react';
import { motivationFor, spendingInsight } from './spending-coach';
import { monthLabel } from './history-utils';
import './spending-coach.css';

export default function SpendingCoach({ activities, limit, userId, money }) {
  const insight = useMemo(() => spendingInsight(activities, limit), [activities, limit]);
  const [offset, setOffset] = useState(0);
  const message = motivationFor(insight, userId, offset);
  return <section className={`spending-coach coach-${insight.state}`} aria-label="Kebiasaan belanja bulan ini">
    <div className="coach-heading"><span className="coach-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 20h16M7 16v-4m5 4V8m5 8V4"/><path d="m4 7 4-3 4 2 6-4"/></svg></span><div><span className="coach-eyebrow">TEMAN ATUR UANGMU</span><h2>{insight.title}</h2></div></div>
    <p className="coach-explanation">{insight.explanation}</p>
    <div className="coach-totals"><div><span>Masuk bulan ini</span><strong>{money(insight.income)}</strong></div><div><span>Keluar bulan ini</span><strong>{money(insight.expense)}</strong></div></div>
    <div className="coach-motivation"><p aria-live="polite">{message}</p><button type="button" onClick={() => setOffset(previous => previous + 1)}>Pesan semangat lain <span aria-hidden="true">↻</span></button></div>
    <details><summary>Bagaimana penilaiannya?</summary><p>Periode {monthLabel(insight.month)}. Ini indikator sederhana dari transaksi yang kamu catat, bukan penilaian dirimu atau kepastian kondisi keuanganmu.</p><ul><li>Batas anggaran diutamakan: mulai 80% perlu dijaga, di atas 100% melewati anggaran.</li><li>Jika belum mendekati batas, pengeluaran sampai 70% pemasukan ditandai cenderung hemat.</li><li>Tanpa pemasukan atau anggaran, aplikasi meminta catatan dilengkapi.</li><li>Transfer celengan dipisahkan dari belanja. Sisa pemasukan belum tentu saldo dompet karena ada saldo awal dan tabungan.</li></ul><p>Kebutuhan penting bisa membuat pengeluaran tinggi. Bulan berjalan dan catatan yang belum lengkap dapat mengubah hasilnya.</p></details>
  </section>;
}
