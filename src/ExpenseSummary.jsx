import React from 'react';
import { categorySummary, jakartaMonth, monthLabel } from './history-utils';

export default function ExpenseSummary({ activities, money }) {
  const month = jakartaMonth();
  const { total, categories } = categorySummary(activities, month);
  return <section className="expense-summary"><div className="section-heading"><h2>Uangmu untuk apa?</h2></div><p className="category-period">{monthLabel(month)} • Total {money(total)}</p>
    {!categories.length ? <p className="category-empty">Belum ada pengeluaran bulan ini. Catat pengeluaran untuk melihat ringkasannya.</p> : <div className="category-list">{categories.map((category, index) => <div className="category-row" key={category.name}><div><span className={`category-dot dot-${index % 6}`} /><strong>{category.name}</strong><span>{money(category.amount)} <small>({category.percent}%)</small></span></div><div className="category-track"><span className={`bar-${index % 6}`} style={{ width: `${category.percent}%` }} /></div></div>)}</div>}
  </section>;
}
