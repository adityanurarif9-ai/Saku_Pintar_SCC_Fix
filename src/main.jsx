import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './pwa';
import TransactionSheet from './TransactionSheet';
import InstallApp from './InstallApp';
import AuthGate from './AuthGate';
import AdminPanel from './AdminPanel';
import { emptyWallet, loadWallet, submitWallet, walletMessage } from './wallet-api';

const rupiah = value => 'Rp' + new Intl.NumberFormat('id-ID').format(value);
const parseMoney = value => Number(String(value || '').replace(/[^0-9]/g, ''));

function Goal({ goal }) {
  const percent = Math.min(100, Math.round(goal.saved / goal.target * 100));
  return <article className="goal-card">
    <h3>{goal.name} — Target {rupiah(goal.target)}</h3>
    <p>Terkumpul {rupiah(goal.saved)} ({percent}%)</p>
    {goal.notes && <p className="goal-notes">{goal.notes}</p>}
    <div className="progress" role="progressbar" aria-label={`Tabungan ${goal.name}`} aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100">
      <span className={percent > 0 ? 'has-progress' : ''} style={{ width: `${percent}%` }} />
    </div>
  </article>;
}

function App({ account }) {
  const [data, setData] = useState(emptyWallet);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletFailure, setWalletFailure] = useState('');
  const [reload, setReload] = useState(0);
  const [saving, setSaving] = useState(false);
  const submitLock = useRef(false);
  useEffect(() => {
    let active = true;
    setWalletLoading(true); setWalletFailure('');
    loadWallet().then(next => { if (active) setData(next); })
      .catch(error => { if (active) setWalletFailure(walletMessage(error)); })
      .finally(() => { if (active) setWalletLoading(false); });
    return () => { active = false; };
  }, [account.user.id, reload]);
  const [tab, setTab] = useState('Beranda');
  useEffect(() => { document.title = `${tab} — SakuPintar`; }, [tab]);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef(null);
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  function open(type) { clearTimeout(closeTimer.current); setClosing(false); setError(''); setModal(type); }
  function closeModal() {
    if (closing || submitLock.current) return;
    setClosing(true);
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180;
    closeTimer.current = setTimeout(() => { setModal(null); setClosing(false); }, duration);
  }
  async function submit(event) {
    event.preventDefault();
    if (closing || submitLock.current) return;
    const form = new FormData(event.currentTarget);
    const amount = parseMoney(form.get('amount'));
    if (!Number.isSafeInteger(amount) || amount <= 0) return setError('Masukkan nominal rupiah bulat yang valid.');
    submitLock.current = true; setSaving(true); setError('');
    try {
      const next = await submitWallet(modal, form);
      setData(next);
      submitLock.current = false;
      closeModal();
      setNotice('Berhasil disimpan ke akunmu.');
    } catch (error) { setError(walletMessage(error)); }
    finally { submitLock.current = false; setSaving(false); }
  }
  return <div className="app-shell">
    <header className="header" inert={modal ? true : undefined}>
      <img className="logo" src="/saku-pintar-logo.png" alt="Logo Saku Pintar" />
      <div className="greeting"><span className="brand">SakuPintar{account.profile.role === 'admin' ? ' • Admin' : ''}</span><h1>Halo, {account.profile.display_name || 'teman'}!</h1><p>Yuk, atur keuanganmu hari ini.</p></div>
      <button className="profile" aria-label="Informasi akun" onClick={() => open('profile')}><span /></button>
    </header>
    <main key={tab} className="page-content" inert={modal ? true : undefined}>
      {tab === 'Admin' && account.profile.role === 'admin' ? <AdminPanel /> : walletLoading ? <p role="status">Memuat data akunmu…</p> : walletFailure ? <section><p className="auth-error" role="alert">{walletFailure}</p><button className="full-button" onClick={() => setReload(value => value + 1)}>Coba Lagi</button></section> : <>
      {tab === 'Beranda' && <>
        <section className="balance-card" aria-label="Ringkasan saldo">
          <div className="balance-top"><h2>Total Saldo</h2><span>Saldo yang tersedia</span></div>
          <p key={data.balance} className="balance-number">{rupiah(data.balance)}</p>
          <div className="balance-actions"><button className="button-yellow" onClick={() => open('income')}>+ Tambah Saldo</button><button className="button-outline" onClick={() => open('transfer')}>Transfer ke Celengan</button></div>
        </section>
        <section className="summary" aria-label="Pemasukan dan pengeluaran">
          <article><span className="stat-icon incoming">↓</span><div><h2>Pemasukan</h2><strong className="green">{rupiah(data.income)}</strong><p>Bulan ini</p></div></article>
          <article><span className="stat-icon outgoing">↑</span><div><h2>Pengeluaran</h2><strong className="red">{rupiah(data.expense)}</strong><p>Bulan ini</p></div></article>
        </section>
        <section className="quick-section"><h2 className="eyebrow">AKSI CEPAT</h2><div className="quick-actions"><button onClick={() => open('income')}>Tambah Saldo</button><button onClick={() => open('expense')}>Catat Pengeluaran</button><button onClick={() => open('goal')}>Tambah Target</button></div></section>
      </>}
      {(tab === 'Beranda' || tab === 'Riwayat') && <section className="activity-section">
        <div className="section-heading"><h2>{tab === 'Riwayat' ? 'Riwayat Transaksi' : 'Aktivitas Terakhir'}</h2>{tab === 'Beranda' && <button onClick={() => setTab('Riwayat')}>Lihat Semua</button>}</div>
        <div className="activity-list">{data.activities.slice(0, tab === 'Beranda' ? 3 : undefined).map(item => <article className="activity" key={item.id}><div><h3>{item.title}</h3><p>{item.date || 'Hari Ini'} • {item.category}</p>{tab === 'Riwayat' && item.notes && <p>{item.notes}</p>}</div><strong className={item.kind === 'income' ? 'green' : item.kind === 'expense' ? 'red' : 'blue'}>{item.kind === 'income' ? '+' : '-'}{rupiah(item.amount)}</strong></article>)}{!data.activities.length && <p className="empty-state">Belum ada transaksi. Tambahkan saldo pertamamu.</p>}</div>
      </section>}
      {(tab === 'Beranda' || tab === 'Celengan') && <section className="goals-section">
        <div className="section-heading"><h2>Target Tabunganku</h2><button onClick={() => tab === 'Beranda' ? setTab('Celengan') : open('goal')}>{tab === 'Beranda' ? 'Lihat Celengan' : '+ Tambah Target'}</button></div>
        {(tab === 'Beranda' ? data.goals.slice(0, 1) : data.goals).map(goal => <Goal goal={goal} key={goal.id} />)}
        {!data.goals.length && <p className="empty-state">Belum ada target tabungan. Yuk, buat target pertamamu!</p>}
        {tab === 'Celengan' && <button className="full-button" onClick={() => open('transfer')}>Transfer ke Celengan</button>}
      </section>}
      {notice && <p role="status" className="notice">{notice}</p>}
      {tab === 'Beranda' && <InstallApp compact />}
      </>}
    </main>
    <nav className={`bottom-nav${account.profile.role === 'admin' ? ' admin-nav' : ''}`} inert={modal ? true : undefined} aria-label="Navigasi utama">{['Beranda', 'Celengan', 'Riwayat', ...(account.profile.role === 'admin' ? ['Admin'] : [])].map(name => <button key={name} className={tab === name ? 'active' : ''} aria-current={tab === name ? 'page' : undefined} onClick={() => setTab(name)}>{name}</button>)}</nav>
    {modal && <TransactionSheet type={modal} account={account} saving={saving} closing={closing} balance={data.balance} goals={data.goals} error={error} onClose={closeModal} onSubmit={submit} />}
  </div>;
}

createRoot(document.getElementById('root')).render(<AuthGate>{account => <App key={account.user.id} account={account} />}</AuthGate>);
