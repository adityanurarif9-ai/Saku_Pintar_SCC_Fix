import { supabase } from './supabase';
export const emptyWallet = { balance: 0, income: 0, expense: 0, goals: [], activities: [] };
export async function loadWallet() {
  const { data, error } = await supabase.rpc('wallet_snapshot');
  if (error) throw error;
  return data;
}
export async function submitWallet(type, form) {
  const money = value => Number(String(value || '').replace(/[^0-9]/g, ''));
  const date = new Date();
  const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const { data, error } = await supabase.rpc('wallet_mutate', {
    p_kind: type, p_amount: money(form.get('amount')),
    p_name: String(form.get('name') || '').trim(),
    p_category: String(form.get('category') || ''),
    p_date: String(form.get('date') || localDate),
    p_notes: String(form.get('notes') || '').trim(),
    p_goal: form.get('goal') || null,
    p_initial: money(form.get('initialAmount')),
  });
  if (error) throw error;
  return data;
}
export function walletMessage(error) {
  // Only show known validation messages; don't expose server diagnostics.
  const known = ['Saldo tidak cukup.', 'Nominal tidak valid.', 'Nama wajib diisi.', 'Target tabungan tidak ditemukan.', 'Nominal awal melebihi target.', 'Transfer melebihi sisa target.', 'Kategori tidak valid.', 'Maintenance sedang berlangsung. Coba lagi setelah pembaruan selesai.'];
  return known.includes(error?.message) ? error.message : 'Data belum berhasil disimpan atau dimuat. Periksa koneksi lalu coba lagi.';
}
