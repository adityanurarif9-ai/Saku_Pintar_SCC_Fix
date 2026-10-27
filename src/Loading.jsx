import React from 'react';

export function BusyLabel({ children }) {
  return <span className="busy-label"><span className="spinner" aria-hidden="true" />{children}</span>;
}

export default function LoadingScreen({ label = 'Menyiapkan SakuPintar…' }) {
  return <div className="app-shell splash-screen" role="status" aria-live="polite">
    <div className="splash-logo"><img src="/icons/icon-192.png" alt="" width="96" height="96" /></div>
    <h1>SakuPintar</h1><p>{label}</p>
    <div className="loading-dots" aria-hidden="true"><span /><span /><span /></div>
    <span className="splash-caption">Langkah kecil, mimpi besar.</span>
  </div>;
}

export function WalletSkeleton() {
  return <section className="wallet-skeleton" role="status" aria-label="Memuat data dompet">
    <span className="sr-only">Sedang memuat saldo, transaksi, dan target tabungan…</span>
    <div aria-hidden="true"><div className="skeleton skeleton-balance" /><div className="skeleton-summary"><div className="skeleton" /><div className="skeleton" /></div><div className="skeleton skeleton-title" /><div className="skeleton skeleton-list" /><div className="skeleton skeleton-title" /><div className="skeleton skeleton-goal" /></div>
  </section>;
}
