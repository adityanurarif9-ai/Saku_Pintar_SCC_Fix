import { createClient } from '@supabase/supabase-js';
import { confirmationError } from './auth-urls';

// Capture callback failures before the SDK clears authentication URL fragments.
export const authLinkIssue = typeof window === 'undefined' ? '' : confirmationError(window.location.href);

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
let client = null;
try {
  if (url?.startsWith('https://') && key) {
    client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  }
} catch { /* Invalid configuration is shown on the sign-in page, without leaking keys. */ }
export const supabase = client;
export const authConfigured = Boolean(client);

export function authMessage(error) {
  const code = error?.code;
  if (code === 'invalid_credentials') return 'Email atau password belum cocok. Coba periksa lagi.';
  if (code === 'email_not_confirmed') return 'Konfirmasi email melalui tautan yang dikirim sebelum masuk.';
  if (code === 'user_already_exists') return 'Email ini sudah terdaftar. Silakan masuk.';
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') return 'Terlalu banyak percobaan. Tunggu sebentar sebelum mencoba lagi.';
  if (code === 'weak_password') return 'Password belum memenuhi ketentuan. Gunakan minimal 8 karakter yang sulit ditebak.';
  if (code === 'same_password') return 'Gunakan password baru yang berbeda dari sebelumnya.';
  return 'Permintaan belum berhasil. Periksa koneksi dan coba lagi. Jika berlanjut, hubungi pengelola aplikasi.';
}
