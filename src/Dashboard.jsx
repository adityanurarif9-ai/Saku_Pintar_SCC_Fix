import React, { useEffect, useRef, useState } from 'react';
import TransactionSheet from './TransactionSheet';
import InstallApp from './InstallApp';
import AdminPanel from './AdminPanel';
import { emptyWallet, loadWallet, submitWallet, walletMessage } from './wallet-api';
import { WalletSkeleton } from './Loading';
import Onboarding from './Onboarding';
import History, { ActivityList } from './History';
import ExpenseSummary from './ExpenseSummary';
import { readPreferences, savePreference } from './preferences';
import { jakartaMonth, monthLabel } from './history-utils';
import ExpenseEntry, { ExpenseDock } from './ExpenseEntry';

const defaultApi = { load: loadWallet, submit: submitWallet };
const rupiah = value => 'Rp' + new Intl.NumberFormat('id-ID').format(value);
const parseMoney = value => Number(String(value || '').replace(/[^0-9]/g, ''));

function Goal({ goal, money }) {
  const percent = Math.min(100, Math.round(goal.saved / goal.target * 100));
  return <article className="goal-card">
    <h3>{goal.name} — Target {money(goal.target)}</h3>
    <p>Terkumpul {money(goal.saved)} ({percent}%)</p>
    {goal.notes && <p className="goal-notes">{goal.notes}</p>}
    <div className="progress" role="progressbar" aria-label={`Tabungan ${goal.name}`} aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100">
      <span className={percent > 0 ? 'has-progress' : ''} style={{ width: `${percent}%` }} />
    </div>
  </article>;
}

export default function Dashboard({ account, api = defaultApi }) {
  const [data, setData] = useState(emptyWallet);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletFailure, setWalletFailure] = useState('');
  const [reload, setReload] = useState(0);
  const [saving, setSaving] = useState(false);
  const submitLock = useRef(false);
  const [hidden, setHidden] = useState(() => readPreferences(account.user.id).hidden === true);
  const [tutorial, setTutorial] = useState(() => readPreferences(account.user.id).onboarded !== true);
  const tutorialVisible = tutorial && !walletLoading && !walletFailure;
  const money = value => hidden ? '••••••' : rupiah(value);
  function toggleHidden() {
    setHidden(value => { savePreference(account.user.id, 'hidden', !value); return !value; });
  }
  function finishTutorial(action) {
    savePreference(account.user.id, 'onboarded', true);
    setTutorial(false);
    if (action === 'income') open('income');
  }
  function replayTutorial() {
    clearTimeout(closeTimer.current);
    setModal(null); setClosing(false); setTab('Beranda'); setTutorial(true);
  }
  useEffect(() => {
    let active = true;
    setWalletLoading(true); setWalletFailure('');
    api.load().then(next => { if (active) setData(next); })
      .catch(error => { if (active) setWalletFailure(walletMessage(error)); })
      .finally(() => { if (active) setWalletLoading(false); });
    return () => { active = false; };
  }, [account.user.id, reload, api]);
  const [tab, setTab] = useState('Beranda');
  const mainRef = useRef(null);
  const expenseRef = useRef(null);
  const [expenseVisible, setExpenseVisible] = useState(true);
  useEffect(() => {
    if (tab !== 'Beranda') { setExpenseVisible(false); return; }
    if (!expenseRef.current || !mainRef.current) { setExpenseVisible(true); return; }
    if (!('IntersectionObserver' in window)) { setExpenseVisible(false); return; }
    const observer = new IntersectionObserver(([entry]) => setExpenseVisible(entry.isIntersecting && entry.intersectionRatio >= .4), { root: mainRef.current, threshold: [0, .4] });
    observer.observe(expenseRef.current);
    return () => observer.disconnect();
  }, [tab, walletLoading, walletFailure]);
  useEffect(() => { document.title = `${tab} — SakuPintar`; }, [tab]);
  const [modal, setModal] = useState(null);
  const blocked = Boolean(modal || tutorialVisible);
  const showExpenseDock = !blocked && !walletLoading && !walletFailure && tab !== 'Admin' && !expenseVisible;
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const notify = message => setNotice({ message, id: Date.now() });
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
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
      const next = await api.submit(modal, form);
      setData(next);
      submitLock.current = false;
      closeModal();
      notify(modal === 'expense' ? 'Pengeluaran berhasil dicatat.' : 'Berhasil disimpan ke akunmu.');
    } catch (error) { setError(walletMessage(error)); }
    finally { submitLock.current = false; setSaving(false); }
  }
  return <div className="app-shell">
    <header className="header" inert={blocked ? true : undefined}>
      <img className="logo" src="/saku-pintar-logo.png" alt="Logo Saku Pintar" />
      <div className="greeting"><span className="brand">SakuPintar{account.profile.role === 'admin' ? ' • Admin' : ''}</span><h1>Halo, {account.profile.display_name || 'teman'}!</h1><p>Yuk, atur keuanganmu hari ini.</p></div>
      <button className="profile" aria-label="Informasi akun" onClick={() => open('profile')}><span /></button>
    </header>
    <main key={tab} ref={mainRef} className={`page-content${showExpenseDock ? ' with-expense-dock' : ''}`} inert={blocked ? true : undefined}>
      {tab === 'Admin' && account.profile.role === 'admin' ? <AdminPanel /> : walletLoading ? <WalletSkeleton /> : walletFailure ? <section><p className="auth-error" role="alert">{walletFailure}</p><button className="full-button" onClick={() => setReload(value => value + 1)}>Coba Lagi</button></section> : <>
      <div className="wallet-toolbar"><span>{monthLabel(jakartaMonth())}</span><button onClick={() => { setNotice(null); setReload(value => value + 1); }} aria-label="Muat ulang data dompet">↻ Perbarui</button></div>
      {tab === 'Beranda' && <>
        <section className="balance-card" aria-label="Ringkasan saldo">
          <div className="balance-top"><h2>Total Saldo</h2><button className="privacy-toggle" aria-label={hidden ? 'Tampilkan nominal' : 'Sembunyikan nominal'} aria-pressed={hidden} onClick={toggleHidden}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{hidden && <path d="m3 3 18 18" />}</svg><span>{hidden ? 'Tampilkan' : 'Sembunyikan'}</span></button></div>
          <p key={`${data.balance}-${hidden}`} className="balance-number">{money(data.balance)}</p>
          <div className="balance-actions"><button className="button-yellow" onClick={() => open('income')}>+ Tambah Saldo</button><button className="button-outline" onClick={() => open('transfer')}>Transfer ke Celengan</button></div>
        </section>
        <ExpenseEntry buttonRef={expenseRef} onClick={() => open('expense')} />
        <section className="summary" aria-label="Pemasukan dan pengeluaran">
          <article><span className="stat-icon incoming">↓</span><div><h2>Pemasukan</h2><strong className="green">{money(data.income)}</strong><p>Bulan ini</p></div></article>
          <article><span className="stat-icon outgoing">↑</span><div><h2>Pengeluaran</h2><strong className="red">{money(data.expense)}</strong><p>Bulan ini</p></div></article>
        </section>
        <section className="quick-section"><h2 className="eyebrow">RENCANAKAN TABUNGANMU</h2><div className="quick-actions savings-actions"><button onClick={() => open('transfer')}><span className="savings-action-icon" aria-hidden="true">↗</span><span>Isi Celengan<small>Pindahkan saldo ke tabungan</small></span></button><button onClick={() => open('goal')}><span className="savings-action-icon target-action-icon" aria-hidden="true">◎</span><span>Buat Target<small>Mulai tujuan tabunganmu</small></span></button></div></section>
      </>}
      {tab === 'Beranda' && <section className="activity-section">
        <div className="section-heading"><h2>Aktivitas Terakhir</h2><button onClick={() => setTab('Riwayat')}>Lihat Semua</button></div>
        <ActivityList activities={data.activities.slice(0, 3)} money={money} emptyMessage="Belum ada transaksi. Tambahkan saldo pertamamu." />
      </section>}
      {tab === 'Riwayat' && <History activities={data.activities} money={money} onNotice={notify} />}
      {(tab === 'Beranda' || tab === 'Celengan') && <section className="goals-section">
        <div className="section-heading"><h2>Target Tabunganku</h2><button onClick={() => tab === 'Beranda' ? setTab('Celengan') : open('goal')}>{tab === 'Beranda' ? 'Lihat Celengan' : '+ Tambah Target'}</button></div>
        {(tab === 'Beranda' ? data.goals.slice(0, 1) : data.goals).map(goal => <Goal goal={goal} money={money} key={goal.id} />)}
        {!data.goals.length && <p className="empty-state">Belum ada target tabungan. Yuk, buat target pertamamu!</p>}
        {tab === 'Celengan' && <button className="full-button" onClick={() => open('transfer')}>Transfer ke Celengan</button>}
      </section>}
      {tab === 'Beranda' && <ExpenseSummary activities={data.activities} money={money} />}
      {tab === 'Beranda' && <InstallApp compact />}
      </>}
    </main>
    <nav className={`bottom-nav${account.profile.role === 'admin' ? ' admin-nav' : ''}`} inert={blocked ? true : undefined} aria-label="Navigasi utama">{['Beranda', 'Celengan', 'Riwayat', ...(account.profile.role === 'admin' ? ['Admin'] : [])].map(name => <button key={name} className={tab === name ? 'active' : ''} aria-current={tab === name ? 'page' : undefined} onClick={() => setTab(name)}>{name}</button>)}</nav>
    {showExpenseDock && <ExpenseDock onClick={() => open('expense')} />}
    {notice && !blocked && <p className={`toast-message${showExpenseDock ? ' toast-above-dock' : ''}`} role="status" key={notice.id}>✓ {notice.message}</p>}
    {modal && <TransactionSheet type={modal} account={account} onReplayTutorial={replayTutorial} saving={saving} closing={closing} balance={data.balance} goals={data.goals} error={error} onClose={closeModal} onSubmit={submit} />}
    {tutorialVisible && <Onboarding onFinish={finishTutorial} />}
  </div>;
}


