import React, { useEffect, useState } from 'react';
import { supabase, authMessage, authLinkIssue } from './supabase';
import InstallApp from './InstallApp';
import { BusyLabel } from './Loading';
import { authRedirectUrl } from './auth-urls';

export default function AuthScreen({ recovery = false, onRecovered, adminAccess = false, onBackToMaintenance, client = supabase }) {
  const [mode, setMode] = useState(recovery ? 'reset' : 'login');
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState(authLinkIssue);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendUntil, setResendUntil] = useState(0);
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!resendUntil) return;
    const tick = () => setRemaining(Math.max(0, Math.ceil((resendUntil - Date.now()) / 1000)));
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [resendUntil]);
  async function resendConfirmation() {
    if (busy || resending || remaining || !client) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Isi alamat email akunmu terlebih dahulu.'); return; }
    setResending(true); setError(''); setMessage('');
    try {
      const { error } = await client.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: authRedirectUrl() } });
      if (error) { setError(authMessage(error)); return; }
      setMessage('Jika akun masih perlu diverifikasi, email baru akan dikirim. Gunakan tautan terbaru dan periksa folder spam.');
      setResendUntil(Date.now() + 60000); setRemaining(60);
    } catch { setError('Email belum berhasil dikirim. Periksa koneksi dan coba lagi.'); }
    finally { setResending(false); }
  }
  useEffect(() => {
    const labels = { login: 'Masuk', signup: 'Daftar', forgot: 'Lupa Password', reset: 'Password Baru' };
    document.title = `${labels[mode]} — SakuPintar`;
  }, [mode]);
  const titles = { login: 'Selamat datang kembali!', signup: 'Mulai langkah pintarmu.', forgot: 'Lupa password?', reset: 'Buat password baru.' };
  const captions = { login: 'Masuk untuk mengatur uang saku dan melanjutkan target tabunganmu.', signup: 'Buat akun dan mulai kelola keuanganmu sendiri.', forgot: 'Kami akan mengirim tautan pemulihan ke emailmu.', reset: 'Pilih password yang kuat untuk menjaga akunmu.' };
  function change(next) { setMode(next); setError(''); setMessage(''); setVisible(false); }
  async function submit(event) {
    event.preventDefault();
    if (busy || resending || !client) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    if (mode === 'signup' && !String(form.get('name') || '').trim()) return setError('Isi nama lengkapmu.');
    if ((mode === 'signup' || mode === 'reset') && password !== form.get('confirm')) return setError('Konfirmasi password belum sama.');
    setBusy(true); setError(''); setMessage('');
    try {
      const redirect = authRedirectUrl();
      let result;
      if (mode === 'login') result = await client.auth.signInWithPassword({ email, password });
      if (mode === 'signup') {
        result = await client.auth.signUp({ email, password, options: { emailRedirectTo: redirect, data: { display_name: String(form.get('name')).trim() } } });
        if (!result.error && !result.data.session) setMessage('Periksa emailmu untuk konfirmasi akun, lalu kembali ke halaman Masuk.');
      }
      if (mode === 'forgot') {
        result = await client.auth.resetPasswordForEmail(email, { redirectTo: redirect });
        if (!result.error) setMessage('Jika email terdaftar, tautan pemulihan akan dikirim. Periksa kotak masuk dan spam.');
      }
      if (mode === 'reset') {
        result = await client.auth.updateUser({ password });
        if (!result.error) { setMessage('Password berhasil diubah.'); onRecovered(); }
      }
      if (result.error) setError(authMessage(result.error));
    } catch { setError('Tidak dapat terhubung. Periksa koneksi internetmu.'); }
    finally { setBusy(false); }
  }
  return <div className="app-shell auth-shell"><main className="auth-main">
    {adminAccess && <div className="maintenance-admin-entry"><p>Maintenance sedang aktif. Masuk dengan akun admin untuk mengelola pembaruan.</p><button onClick={onBackToMaintenance}>← Kembali ke halaman maintenance</button></div>}
    <div className="auth-brand"><img src="/saku-pintar-logo.png" alt="Saku Pintar" /><span>SAKUPINTAR</span></div>
    <div className="auth-intro"><span className="auth-eyebrow">UANG SAKU TERATUR, MIMPI MAKIN DEKAT</span><h1>{titles[mode]}</h1><p>{captions[mode]}</p></div>
    <section className="auth-card">
      {!recovery && !adminAccess && <div className="auth-tabs" aria-label="Pilihan akun"><button type="button" aria-pressed={mode === 'login'} className={mode === 'login' ? 'selected' : ''} disabled={busy || resending} onClick={() => change('login')}>Masuk</button><button type="button" aria-pressed={mode === 'signup'} className={mode === 'signup' ? 'selected' : ''} disabled={busy || resending} onClick={() => change('signup')}>Daftar</button></div>}
      {!client && <p className="setup-note" role="status">Login belum diaktifkan oleh pengelola. Konfigurasi Supabase diperlukan sebelum akun bisa digunakan.</p>}
      <form key={mode} onSubmit={submit} aria-busy={busy}>
        {mode === 'signup' && <label>Nama lengkap<input name="name" placeholder="Nama kamu" maxLength={60} autoComplete="name" required /></label>}
        {mode !== 'reset' && <label>Email<input name="email" type="email" placeholder="nama@email.com" autoComplete="email" maxLength={254} required value={email} onChange={event => setEmail(event.target.value)} /></label>}
        {mode !== 'forgot' && <>
          <label>Password<div className="password-field"><input aria-label="Password" name="password" type={visible ? 'text' : 'password'} placeholder={mode === 'login' ? 'Masukkan password' : 'Minimal 8 karakter'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'login' ? 1 : 8} maxLength={128} required /><button type="button" aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'} onClick={() => setVisible(!visible)}>{visible ? 'Sembunyi' : 'Lihat'}</button></div></label>
          {(mode === 'signup' || mode === 'reset') && <label>Konfirmasi password<input name="confirm" type={visible ? 'text' : 'password'} autoComplete="new-password" placeholder="Ulangi password" minLength={8} maxLength={128} required /></label>}
        </>}
        {mode === 'login' && <button className="forgot-link" type="button" disabled={busy} onClick={() => change('forgot')}>Lupa password?</button>}
        {error && <p role="alert" className="auth-error">{error}</p>}
        {message && <p role="status" className="auth-message">{message}</p>}
        <button className="full-button auth-submit" type="submit" disabled={busy || resending || !client}>{busy ? <BusyLabel>Memproses…</BusyLabel> : mode === 'login' ? 'Masuk ke SakuPintar' : mode === 'signup' ? 'Buat Akun' : mode === 'forgot' ? 'Kirim Tautan Pemulihan' : 'Simpan Password Baru'}</button>
        {['login', 'signup'].includes(mode) && <div className="resend-confirmation"><p>Belum menerima email atau tautan verifikasi bermasalah?</p><button type="button" disabled={busy || resending || remaining > 0 || !client} onClick={resendConfirmation}>{resending ? 'Mengirim email…' : remaining ? `Kirim ulang dalam ${remaining} detik` : 'Kirim ulang email verifikasi'}</button></div>}
        {mode === 'forgot' && <button type="button" className="cancel-button" disabled={busy} onClick={() => change('login')}>Kembali ke Masuk</button>}
      </form>
      <p className="auth-footnote">Admin dan pengguna masuk melalui halaman yang sama. Akses mengikuti peran akun.</p>
    </section>
    <InstallApp compact />
    <p className="auth-tagline">Sedikit demi sedikit, jadi berarti.</p>
  </main></div>;
}
