export function authMessage(error) {
  const code = error?.code;
  if (code === 'invalid_credentials') return 'Email atau password belum cocok. Coba periksa lagi.';
  if (code === 'email_not_confirmed') return 'Konfirmasi email melalui tautan yang dikirim sebelum masuk.';
  if (code === 'user_already_exists') return 'Email ini sudah terdaftar. Silakan masuk.';
  if (code === 'over_email_send_rate_limit') return 'Layanan pengiriman email sedang mencapai batas. Pendaftaran dan email verifikasi belum bisa dikirim. Jika akunmu sudah terverifikasi, pilih Masuk. Hubungi pengelola jika masalah berlanjut.';
  if (code === 'over_request_rate_limit' || error?.status === 429) return 'Permintaan terlalu sering. Beri jeda sebelum mencoba lagi. Jika akunmu sudah dibuat, pilih Masuk untuk melanjutkan.';
  if (code === 'email_address_not_authorized') return 'Email verifikasi belum bisa dikirim ke alamat ini. Pengelola perlu menyiapkan layanan pengirim email aplikasi.';
  if (code === 'weak_password') return 'Password belum memenuhi ketentuan. Gunakan minimal 8 karakter yang sulit ditebak.';
  if (code === 'same_password') return 'Gunakan password baru yang berbeda dari sebelumnya.';
  return 'Permintaan belum berhasil. Periksa koneksi dan coba lagi. Jika berlanjut, hubungi pengelola aplikasi.';
}
export function rateLimited(error) { return ['over_email_send_rate_limit','over_request_rate_limit'].includes(error?.code) || error?.status === 429; }
const key = 'sakupintar:email-pause:v1';
function storage() { try { return window.sessionStorage; } catch { return null; } }
export function readEmailPause(store = storage(), now = Date.now()) {
  try { const value = Number(store?.getItem(key)); return Number.isSafeInteger(value) && value > now && value <= now + 60000 ? value : 0; } catch { return 0; }
}
export function startEmailPause(store = storage(), now = Date.now()) {
  const until = now + 60000;
  try { store?.setItem(key, String(until)); } catch { /* Private browsing can reject storage; keep the in-memory pause. */ }
  return until;
}
