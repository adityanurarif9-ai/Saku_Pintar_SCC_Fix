import React, { useEffect, useRef, useState } from 'react';

const steps = [
  { eyebrow: 'SELAMAT DATANG', title: 'Kenalan dulu, yuk!', text: 'SakuPintar bantu kamu mencatat uang saku dan menabung. Mulai dari hal kecil, lakukan setiap hari.', icon: 'wallet', hint: 'Data dompet terpisah untuk setiap akun.' },
  { eyebrow: 'LANGKAH 1 · CATAT UANG MASUK', title: 'Uang masuk, langsung catat.', text: 'Ketuk Tambah Saldo saat menerima uang saku, gaji, atau hadiah. Isi nominal dan sumbernya, lalu simpan.', icon: 'plus', hint: 'Saldo awal akun baru Rp0. Tambahkan pemasukan pertamamu.' },
  { eyebrow: 'LANGKAH 2 · KENALI KEBIASAANMU', title: 'Tahu uangmu ke mana.', text: 'Catat pengeluaran dan pilih kategorinya. Di Riwayat, kamu bisa mencari transaksi, menyaring bulan, dan mengekspor CSV.', icon: 'chart', hint: 'Ringkasan kategori membantu melihat pengeluaran bulan ini.' },
  { eyebrow: 'LANGKAH 3 · WUJUDKAN TARGET', title: 'Sedikit-sedikit, jadi tujuan.', text: 'Buat target di Celengan, lalu pindahkan sebagian saldo ke tabungan. Nominal awal dan transfer diambil dari saldo yang tersedia.', icon: 'target', hint: 'Tutorial ini bisa dibuka lagi melalui menu akun.' },
];
function Illustration({ type }) {
  return <div className={`onboarding-art art-${type}`} aria-hidden="true"><span className="art-spark spark-one" /><span className="art-spark spark-two" /><svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
    {type === 'wallet' ? <><rect x="23" y="35" width="76" height="57" rx="14" /><path d="M30 35V24h57v11M78 53h24v23H78a11.5 11.5 0 0 1 0-23Z" /><circle cx="84" cy="64" r="2" /></> : type === 'plus' ? <><rect x="23" y="24" width="74" height="74" rx="22" /><path d="M60 43v34M43 60h34" /></> : type === 'chart' ? <><path d="M24 94h76M34 77V58M60 77V40M86 77V23" /><path d="m30 42 25-19 19 5 19-13" /></> : <><circle cx="60" cy="60" r="38" /><circle cx="60" cy="60" r="23" /><circle cx="60" cy="60" r="7" /><path d="m65 55 35-35M86 20h14v14" /></>}
  </svg></div>;
}
export default function Onboarding({ onFinish }) {
  const [index, setIndex] = useState(0);
  const ref = useRef(null);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  useEffect(() => {
    const previous = document.activeElement;
    const panel = ref.current;
    panel.focus();
    function keys(event) {
      if (event.key === 'Escape') { event.preventDefault(); finishRef.current(); }
      if (event.key !== 'Tab') return;
      const elements = [...panel.querySelectorAll('button:not(:disabled)')];
      const first = elements[0], last = elements.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel)) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', keys);
    return () => { document.removeEventListener('keydown', keys); previous?.focus(); };
  }, []);
  const step = steps[index], last = index === steps.length - 1;
  return <section className="onboarding" ref={ref} role="dialog" aria-modal="true" aria-labelledby="onboarding-title" tabIndex={-1}>
    <div className="onboarding-top"><span>SakuPintar • Panduan awal</span><button onClick={() => onFinish()}>Lewati dulu</button></div>
    <div key={index} className="onboarding-body" aria-live="polite"><Illustration type={step.icon} /><p className="onboarding-eyebrow">{step.eyebrow}</p><h2 id="onboarding-title">{step.title}</h2><p className="onboarding-description">{step.text}</p><div className="onboarding-hint">{step.hint}</div></div>
    <div className="onboarding-bottom"><div className="step-dots" aria-label={`Langkah ${index + 1} dari ${steps.length}`}>{steps.map((_, position) => <span key={position} className={index === position ? 'current' : ''} />)}</div>
      <div className="onboarding-actions">{index > 0 && <button className="tutorial-back" onClick={() => setIndex(value => value - 1)}>Kembali</button>}<button className="full-button" onClick={() => last ? onFinish('income') : setIndex(value => value + 1)}>{last ? 'Tambah saldo pertama' : index === 0 ? 'Yuk, mulai' : 'Lanjut'}</button></div>
      {last && <button className="tutorial-explore" onClick={() => onFinish()}>Jelajahi beranda dulu</button>}
    </div>
  </section>;
}
