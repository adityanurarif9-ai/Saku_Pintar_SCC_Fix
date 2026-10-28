import React, { useEffect, useState } from 'react';
import { getInstallPrompt, clearInstallPrompt } from './pwa';
import { installPlatform } from './install-platform';

export default function InstallApp({ compact = false }) {
  const [prompt, setPrompt] = useState(getInstallPrompt);
  const [expanded, setExpanded] = useState(!compact);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [platform, setPlatform] = useState(() => installPlatform(navigator) === 'android' ? 'android' : 'ios');
  const isApple = installPlatform(navigator) === 'ios';
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true);
  useEffect(() => {
    const ready = event => { event.preventDefault(); setPrompt(event); };
    const changed = () => setPrompt(getInstallPrompt());
    const complete = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener('beforeinstallprompt', ready);
    window.addEventListener('saku-install-change', changed);
    window.addEventListener('appinstalled', complete);
    return () => { window.removeEventListener('beforeinstallprompt', ready); window.removeEventListener('saku-install-change', changed); window.removeEventListener('appinstalled', complete); };
  }, []);
  async function install() {
    setExpanded(true);
    if (isApple || !prompt || busy) return;
    setBusy(true);
    setMessage('');
    const pending = prompt;
    clearInstallPrompt();
    try {
      await pending.prompt();
      const result = await pending.userChoice;
      setMessage(result.outcome === 'accepted' ? 'Pemasangan disetujui. Tunggu proses selesai, lalu cari ikon SakuPintar di layar utama atau daftar aplikasi.' : 'Belum dipasang. Kamu bisa memasangnya nanti lewat menu browser.');
    } catch {
      setMessage('Gunakan menu browser untuk memasang SakuPintar ke layar utama.');
    } finally { setBusy(false); }
  }
  if (installed) return compact ? null : <p className="install-status">SakuPintar sudah terpasang atau dibuka dalam mode aplikasi.</p>;
  return <section className={`install-app${compact ? ' install-banner' : ''}`} aria-label="Pasang aplikasi">
    <div className="install-overview"><img src="/icons/icon-192.png" alt="" width="42" height="42" /><div><h3>SakuPintar di layar HP</h3><p>Sekali ketuk, langsung buka aplikasimu.</p></div></div>
    <button className="full-button install-button" onClick={install} disabled={busy} aria-expanded={expanded}>{busy ? 'Menunggu pemasangan…' : isApple ? 'Cara pasang di iPhone / iPad' : prompt ? 'Pasang Aplikasi' : expanded ? 'Petunjuk pemasangan' : 'Pasang di Layar Utama'}</button>
    {expanded && <div className="install-instructions">
      <div className="filter-chips" aria-label="Perangkat untuk pemasangan">{[['ios','iPhone / iPad'],['android','Android']].map(([value,label]) => <button key={value} type="button" aria-pressed={platform === value} className={platform === value ? 'selected' : ''} onClick={() => setPlatform(value)}>{label}</button>)}</div>
      {platform === 'android' ? <><p><strong>Android (Chrome)</strong></p>
      <ol><li>Buka SakuPintar melalui Chrome.</li><li>Ketuk menu ⋮ → <strong>Instal aplikasi</strong> atau <strong>Tambahkan ke layar utama</strong>.</li><li>Konfirmasi pemasangan, lalu buka ikon SakuPintar di HP.</li></ol>
      </> : <><p><strong>iPhone / iPad (Safari)</strong></p><ol><li>Buka alamat SakuPintar di Safari.</li><li>Ketuk <strong>Bagikan</strong> (kotak dengan panah ke atas). Pada tampilan tertentu, buka menu <strong>…</strong> terlebih dahulu, lalu pilih Bagikan.</li><li>Gulir menu Bagikan, lalu pilih <strong>Tambahkan ke Layar Utama</strong>. Jika belum muncul, buka <strong>Edit Tindakan</strong> dan tambahkan pilihan tersebut.</li><li>Aktifkan <strong>Buka sebagai App</strong> jika tersedia, lalu ketuk <strong>Tambah</strong>.</li><li>Buka ikon SakuPintar dari layar utama iPhone.</li></ol><p>Di iPhone, pemasangan diselesaikan melalui menu Safari. Tombol di halaman ini menampilkan panduannya.</p></>}
      <p className="install-help">Jika tautan dibuka lewat WhatsApp atau Instagram, pilih Buka di Chrome/Safari dahulu.</p>
      {message && <p role="status" className="install-result">{message}</p>}
    </div>}
  </section>;
}
