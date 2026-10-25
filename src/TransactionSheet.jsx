import React, { useEffect, useRef, useState } from 'react';
import InstallApp from './InstallApp';

const rupiah = value => 'Rp' + new Intl.NumberFormat('id-ID').format(value);
function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function MoneyInput({ name, placeholder, required = true, autoFocus = false, tone = '' }) {
  const [value, setValue] = useState('');
  return <input name={name} type="text" inputMode="numeric" autoFocus={autoFocus} required={required}
    className={`money-input ${tone}`} placeholder={placeholder} value={value} maxLength={23}
    onChange={event => {
      const digits = event.target.value.replace(/[^0-9]/g, '').slice(0, 12);
      setValue(digits ? rupiah(Number(digits)) : '');
    }} />;
}

export default function TransactionSheet({ type, closing, balance, goals, error, onClose, onSubmit }) {
  const sheetRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const sheet = sheetRef.current;
    const focusable = () => [...sheet.querySelectorAll('button, input, select, textarea, [tabindex="0"]')];
    (sheet.querySelector('[autofocus]') || focusable()[0] || sheet).focus();
    function keyboard(event) {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key === 'Tab') {
        const elements = focusable();
        const first = elements[0], last = elements.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', keyboard);
    return () => { document.removeEventListener('keydown', keyboard); previous?.focus(); };
  }, []);
  const titles = { income: 'Tambah Saldo', expense: 'Catat Pengeluaran', goal: 'Buat Target Baru', transfer: 'Transfer ke Celengan', profile: 'SakuPintar' };
  const captions = { income: 'PEMASUKAN BARU', expense: 'PENGELUARAN BARU', goal: 'TARGET TABUNGAN BARU', transfer: 'ISI TABUNGAN', profile: 'TENTANG APLIKASI' };
  const buttons = { income: 'Simpan Pemasukan', expense: 'Simpan Pengeluaran', goal: 'Simpan Target', transfer: 'Simpan Transfer' };
  return <div className={`modal-backdrop${closing ? ' is-closing' : ''}`} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={sheetRef} className={`modal sheet-${type}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" tabIndex={-1}>
      <header className="sheet-heading"><p>{captions[type]}</p><h2 id="modal-title">{titles[type]}</h2></header>
      {type === 'profile' ? <><img className="profile-brand" src="/saku-pintar-logo.png" alt="Saku Pintar" /><p>Teman untuk mengatur uang sakumu.</p><p className="profile-note">Versi awal dengan data contoh. Perubahan disimpan di browser perangkat ini.</p><InstallApp /><button className="full-button" onClick={onClose}>Tutup</button></> : <form onSubmit={onSubmit}>
        <div className="form-fields">
          {type === 'income' && <>
            <label>Nominal pemasukan (Rp) *<MoneyInput name="amount" placeholder="Rp200.000" autoFocus tone="accent-blue" /></label>
            <label>Sumber pemasukan *<select name="name" required defaultValue=""><option value="" disabled>Uang Saku (Gaji / Hadiah / Lainnya)</option><option>Uang Saku</option><option>Gaji</option><option>Hadiah</option><option>Lainnya</option></select></label>
            <label>Tanggal<input type="date" name="date" defaultValue={today()} required /></label>
            <label>Catatan (opsional)<textarea name="notes" placeholder="Uang saku mingguan" maxLength={300} /></label>
          </>}
          {type === 'expense' && <>
            <label>Nama pengeluaran *<input name="name" placeholder="Beli Makan Siang" maxLength={60} required autoFocus /></label>
            <label>Nominal (Rp) *<MoneyInput name="amount" placeholder="Rp15.000" tone="accent-red" /></label>
            <label>Kategori *<select name="category" defaultValue="" required><option value="" disabled>Makanan • Transportasi • Pendidikan • Hiburan</option>{['Makanan', 'Transportasi', 'Pendidikan', 'Hiburan', 'Belanja', 'Lainnya'].map(category => <option key={category}>{category}</option>)}</select></label>
            <p className="validation-note">Validasi: Cegah saldo negatif jika melebihi {rupiah(balance)}</p>
          </>}
          {type === 'goal' && <>
            <label>Nama barang atau target *<input name="name" placeholder="Laptop Kuliah" maxLength={60} required autoFocus className="accent-blue" /></label>
            <label>Target nominal (Rp) *<MoneyInput name="amount" placeholder="Rp5.000.000" /></label>
            <label>Nominal awal tabungan (opsional, default Rp0)<MoneyInput name="initialAmount" placeholder="Rp0" required={false} /></label>
            <label>Target tanggal &amp; Catatan (opsional)<input name="notes" placeholder="Mei 2027 • Untuk desain & tugas kuliah" maxLength={300} /></label>
          </>}
          {type === 'transfer' && <>
            <label>Target tabungan *<select name="goal" required>{goals.map(goal => <option value={goal.id} key={goal.id}>{goal.name}</option>)}</select></label>
            <label>Nominal (Rp) *<MoneyInput name="amount" placeholder="Rp50.000" autoFocus tone="accent-blue" /></label>
            <p className="form-hint">Saldo tersedia {rupiah(balance)}. Transfer memindahkan saldo ke target tabungan.</p>
          </>}
          {error && <p className="error" role="alert">{error}</p>}
        </div>
        <div className="form-actions"><button className="cancel-button" type="button" onClick={onClose}>Batal</button><button className="submit-button" type="submit">{buttons[type]}</button></div>
      </form>}
    </section>
  </div>;
}
