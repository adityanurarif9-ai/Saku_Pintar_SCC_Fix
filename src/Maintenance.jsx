import React, { useEffect, useState } from 'react';
import { BusyLabel } from './Loading';
export function MaintenanceArt() {
  return <div className="maintenance-art" aria-hidden="true"><span className="maintenance-orbit"/><svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><rect x="23" y="13" width="54" height="75" rx="12"/><path d="M40 21h20M45 79h10M35 46l10 10 21-23"/></svg><span className="maintenance-gear">✦</span></div>;
}
export default function MaintenanceScreen({ runtime, onAdminLogin, onSignOut }) {
  const [leaving, setLeaving] = useState(false), [error, setError] = useState('');
  useEffect(() => { document.title = 'Sedang diperbarui — SakuPintar'; }, []);
  return <div className="app-shell maintenance-shell"><main className="maintenance-main"><div className="maintenance-brand"><img src="/icons/icon-192.png" alt=""/><span>SakuPintar</span></div><MaintenanceArt/><span className="maintenance-kicker"><i/>PEMBARUAN APLIKASI</span><h1>Sebentar, kami<br/>sedang berbenah.</h1><p className="maintenance-description">{runtime.status.message}</p><div className="maintenance-note"><span>↻</span><p>Halaman akan terbuka kembali secara otomatis saat maintenance selesai.<small>Status diperiksa setiap 30 detik saat aplikasi terbuka.</small></p></div>{(runtime.error || error) && <p role="alert" className="auth-error">{error || runtime.error}</p>}<button className="full-button" disabled={runtime.refreshing} onClick={runtime.refresh}>{runtime.refreshing ? <BusyLabel>Memeriksa status…</BusyLabel> : 'Cek lagi'}</button>{onAdminLogin && <button className="maintenance-login" onClick={onAdminLogin}>Masuk pengelola</button>}{onSignOut && <button className="maintenance-login" disabled={leaving} onClick={async () => { setLeaving(true); setError(''); try { await onSignOut(); } catch { setError('Keluar belum berhasil. Coba lagi.'); } finally { setLeaving(false); } }}>{leaving ? 'Keluar…' : 'Keluar dari akun'}</button>}<p className="maintenance-footer">Terima kasih sudah menunggu.<br/>Kami menyiapkan pengalaman yang lebih nyaman untukmu.</p></main></div>;
}
export function MaintenanceControl({ runtime }) {
  const [enabled, setEnabled] = useState(runtime.status.maintenance);
  const [message, setMessage] = useState(runtime.status.message);
  const [saving, setSaving] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('');
  useEffect(() => { setEnabled(runtime.status.maintenance); setMessage(runtime.status.message); }, [runtime.status.updated_at, runtime.status.maintenance, runtime.status.message]);
  async function submit(event) {
    event.preventDefault(); if (saving) return;
    setSaving(true); setError(''); setSuccess('');
    try { await runtime.update(enabled, message.trim()); setSuccess(enabled ? 'Maintenance aktif. Pengguna akan melihat halaman pembaruan dalam maksimal 30 detik.' : 'Maintenance dimatikan. Aplikasi bisa digunakan kembali.'); }
    catch { setError('Pengaturan belum tersimpan. Periksa koneksi dan pastikan akunmu admin.'); }
    finally { setSaving(false); }
  }
  return <section className="maintenance-control"><div className="maintenance-control-title"><h3>Maintenance aplikasi</h3><span className={runtime.status.maintenance ? 'maintenance-active' : 'maintenance-off'}>{runtime.status.maintenance ? 'AKTIF' : 'NONAKTIF'}</span></div><p>Aktifkan sebelum pembaruan, lalu matikan setelah selesai. Akun admin tetap bisa masuk untuk memeriksa aplikasi.</p>{runtime.error && <p className="auth-error" role="alert">{runtime.error}<button type="button" className="forgot-link" onClick={runtime.refresh}>Coba lagi</button></p>}<form onSubmit={submit}><fieldset disabled={saving}><label className="maintenance-checkbox"><input type="checkbox" checked={enabled} onChange={event => { setEnabled(event.target.checked); setSuccess(''); }}/><span>Tampilkan maintenance kepada pengguna</span></label><label>Pesan untuk pengguna<textarea value={message} onChange={event => setMessage(event.target.value)} minLength={1} maxLength={240} required rows={3}/></label><small>{message.length}/240 karakter</small>{error && <p className="auth-error" role="alert">{error}</p>}{success && <p className="auth-message" role="status">{success}</p>}<button className="full-button" disabled={!message.trim()}>{saving ? <BusyLabel>Menyimpan…</BusyLabel> : 'Simpan Pengaturan Maintenance'}</button></fieldset></form></section>;
}
