import React from 'react';

export function ReceiptIcon({ size = 24 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6M9 16h3" /></svg>;
}

export default function ExpenseEntry({ onClick, buttonRef }) {
  return <section className="expense-entry" aria-label="Catat uang yang baru dipakai">
    <div className="expense-entry-intro"><span className="expense-entry-dot" /><p>Habis beli makan, jajan, atau bayar sesuatu?</p></div>
    <button ref={buttonRef} className="expense-primary" aria-label="Catat Pengeluaran" onClick={onClick}>
      <span className="expense-primary-icon"><ReceiptIcon size={28} /></span>
      <span className="expense-primary-copy"><strong>Catat Pengeluaran</strong><span>Uang keluar? Catat di sini.</span></span>
      <span className="expense-primary-arrow" aria-hidden="true">↗</span>
    </button>
  </section>;
}

export function ExpenseDock({ onClick }) {
  return <button className="expense-dock" onClick={onClick} aria-label="Catat Pengeluaran cepat"><ReceiptIcon size={21} /><span>Catat Pengeluaran</span><span className="dock-plus" aria-hidden="true">+</span></button>;
}
