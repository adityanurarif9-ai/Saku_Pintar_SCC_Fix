import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './pwa';
import TransactionSheet from './TransactionSheet';

const rupiah = value => 'Rp' + new Intl.NumberFormat('id-ID').format(value);
const parseMoney = value => Number(String(value || '').replace(/[^0-9]/g, ''));
const initial = {
  balance: 1250000, income: 500000, expense: 150000,
  goals: [{ id: 1, name: 'Laptop', target: 5000000, saved: 1500000 }],
  activities: [
    { id: 1, title: 'Uang Saku', category: 'Pemasukan', amount: 200000, kind: 'income' },
    { id: 2, title: 'Beli Makan', category: 'Makanan', amount: 15000, kind: 'expense' },
    { id: 3, title: 'Tabungan Laptop', category: 'Transfer ke Celengan', amount: 50000, kind: 'transfer' },
  ],
};
function readData() {
  try {
    const data = JSON.parse(localStorage.getItem('saku-pintar-scc-v1'));
    return data && Number.isFinite(data.balance) && Array.isArray(data.goals) && Array.isArray(data.activities) ? data : initial;
  } catch { return initial; }
}

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

function App() {
  const [data, setData] = useState(readData);
  const [tab, setTab] = useState('Beranda');
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  function open(type) { setError(''); setModal(type); }
  function save(next) {
    setData(next);
    try { localStorage.setItem('saku-pintar-scc-v1', JSON.stringify(next)); }
    catch { setNotice('Perubahan tersimpan untuk sesi ini. Penyimpanan browser tidak tersedia.'); }
  }
  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = parseMoney(form.get('amount'));
    if (!Number.isSafeInteger(amount) || amount <= 0) return setError('Masukkan nominal rupiah bulat yang valid.');
    const name = String(form.get('name') || '').trim();
    if (modal === 'goal') {
      if (!name) return setError('Isi nama target tabungan.');
      const saved = parseMoney(form.get('initialAmount'));
      if (!Number.isSafeInteger(saved) || saved < 0) return setError('Nominal awal tabungan tidak valid.');
      if (saved > amount) return setError('Nominal awal tidak boleh melebihi target tabungan.');
      if (saved > data.balance) return setError('Saldo tidak cukup untuk nominal awal tabungan.');
      const id = Date.now();
      save({ ...data, balance: data.balance - saved,
        goals: [...data.goals, { id, name, target: amount, saved, notes: String(form.get('notes') || '').trim() }],
        activities: saved > 0 ? [{ id, title: `Tabungan ${name}`, category: 'Transfer ke Celengan', kind: 'transfer', amount: saved, date: new Date().toLocaleDateString('id-ID') }, ...data.activities] : data.activities,
      });
    } else {
      if (modal !== 'income' && amount > data.balance) return setError('Saldo kamu belum cukup untuk transaksi ini.');
      const selectedGoal = data.goals.find(g => String(g.id) === form.get('goal'));
      if (modal === 'transfer' && !selectedGoal) return setError('Tambahkan target tabungan terlebih dahulu.');
      const kind = modal;
      const activity = {
        id: Date.now(), kind, amount,
        title: kind === 'transfer' ? `Tabungan ${selectedGoal.name}` : name || (kind === 'income' ? 'Tambah Saldo' : 'Pengeluaran'),
        category: kind === 'income' ? 'Pemasukan' : kind === 'transfer' ? 'Transfer ke Celengan' : String(form.get('category') || 'Pengeluaran'),
        date: form.get('date') ? new Date(`${form.get('date')}T12:00:00`).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID'),
        notes: String(form.get('notes') || '').trim(),
      };
      save({
        ...data, balance: data.balance + (kind === 'income' ? amount : -amount),
        income: data.income + (kind === 'income' ? amount : 0),
        expense: data.expense + (kind === 'expense' ? amount : 0),
        goals: data.goals.map(g => kind === 'transfer' && g.id === selectedGoal.id ? { ...g, saved: g.saved + amount } : g),
        activities: [activity, ...data.activities],
      });
    }
    setModal(null);
  }
  return <div className="app-shell">
    <header className="header" inert={modal ? true : undefined}>
      <img className="logo" src="/saku-pintar-logo.png" alt="Logo Saku Pintar" />
      <div className="greeting"><span className="brand">SakuPintar</span><h1>Halo, selamat datang!</h1><p>Yuk, atur keuanganmu hari ini.</p></div>
      <button className="profile" aria-label="Informasi akun" onClick={() => open('profile')}><span /></button>
    </header>
    <main inert={modal ? true : undefined}>
      {tab === 'Beranda' && <>
        <section className="balance-card" aria-label="Ringkasan saldo">
          <div className="balance-top"><h2>Total Saldo</h2><span>Saldo yang tersedia</span></div>
          <p className="balance-number">{rupiah(data.balance)}</p>
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
        <div className="activity-list">{data.activities.slice(0, tab === 'Beranda' ? 3 : undefined).map(item => <article className="activity" key={item.id}><div><h3>{item.title}</h3><p>{item.date || 'Hari Ini'} • {item.category}</p></div><strong className={item.kind === 'income' ? 'green' : item.kind === 'expense' ? 'red' : 'blue'}>{item.kind === 'income' ? '+' : '-'}{rupiah(item.amount)}</strong></article>)}</div>
      </section>}
      {(tab === 'Beranda' || tab === 'Celengan') && <section className="goals-section">
        <div className="section-heading"><h2>Target Tabunganku</h2><button onClick={() => tab === 'Beranda' ? setTab('Celengan') : open('goal')}>{tab === 'Beranda' ? 'Lihat Celengan' : '+ Tambah Target'}</button></div>
        {(tab === 'Beranda' ? data.goals.slice(0, 1) : data.goals).map(goal => <Goal goal={goal} key={goal.id} />)}
        {tab === 'Celengan' && <button className="full-button" onClick={() => open('transfer')}>Transfer ke Celengan</button>}
      </section>}
      {notice && <p role="status" className="notice">{notice}</p>}
    </main>
    <nav className="bottom-nav" inert={modal ? true : undefined} aria-label="Navigasi utama">{['Beranda', 'Celengan', 'Riwayat'].map(name => <button key={name} className={tab === name ? 'active' : ''} aria-current={tab === name ? 'page' : undefined} onClick={() => setTab(name)}>{name}</button>)}</nav>
    {modal && <TransactionSheet type={modal} balance={data.balance} goals={data.goals} error={error} onClose={() => setModal(null)} onSubmit={submit} />}
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
