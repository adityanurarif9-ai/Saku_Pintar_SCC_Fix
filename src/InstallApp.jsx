import React, { useEffect, useState } from 'react';
import { getInstallPrompt, clearInstallPrompt } from './pwa';

export default function InstallApp() {
  const [prompt, setPrompt] = useState(getInstallPrompt);
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true);
  useEffect(() => {
    const ready = event => { event.preventDefault(); setPrompt(event); };
    const complete = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener('beforeinstallprompt', ready);
    window.addEventListener('appinstalled', complete);
    return () => { window.removeEventListener('beforeinstallprompt', ready); window.removeEventListener('appinstalled', complete); };
  }, []);
  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    clearInstallPrompt();
    setPrompt(null);
  }
  if (installed) return <p className="install-status">SakuPintar sudah dibuka dalam mode aplikasi.</p>;
  return <div className="install-app">
    <h3>Pasang SakuPintar</h3>
    <p>Buka langsung dari ikon di layar utama HP.</p>
    {prompt ? <button className="full-button" onClick={install}>Pasang Aplikasi</button> : <p className="install-help">Di Android: buka menu browser → Instal aplikasi atau Tambahkan ke layar utama. Di iPhone: buka Safari → Bagikan → Tambahkan ke Layar Utama → aktifkan Buka sebagai App jika tersedia.</p>}
  </div>;
}
