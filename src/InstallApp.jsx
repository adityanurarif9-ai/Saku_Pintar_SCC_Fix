import React, { useEffect, useState } from 'react';
import { getInstallPrompt, clearInstallPrompt } from './pwa';

export default function InstallApp({ compact = false }) {
  const [prompt, setPrompt] = useState(getInstallPrompt);
  const [expanded, setExpanded] = useState(!compact);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
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
    if (!prompt || busy) return;
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
    <button className="full-button install-button" onClick={install} disabled={busy} aria-expanded={expanded}>{busy ? 'Menunggu pemasangan…' : prompt ? 'Pasang Aplikasi' : expanded ? 'Petunjuk pemasangan' : 'Pasang di Layar Utama'}</button>
    {expanded && <div className="install-instructions">
      <p><strong>Android (Chrome)</strong></p>
      <ol><li>Buka SakuPintar melalui Chrome.</li><li>Ketuk menu ⋮ → <strong>Instal aplikasi</strong> atau <strong>Tambahkan ke layar utama</strong>.</li><li>Konfirmasi pemasangan, lalu buka ikon SakuPintar di HP.</li></ol>
      <p><strong>iPhone (Safari)</strong></p>
      <p>Bagikan → Tambahkan ke Layar Utama → Tambah. Aktifkan Buka sebagai App jika tersedia.</p>
      <p className="install-help">Jika tautan dibuka lewat WhatsApp atau Instagram, pilih Buka di Chrome/Safari dahulu.</p>
      {message && <p role="status" className="install-result">{message}</p>}
    </div>}
  </section>;
}
