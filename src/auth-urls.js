export const PRODUCTION_APP_URL = 'https://saku-pintar-scc-fix.vercel.app/';
function loopback(host) { return ['localhost', '127.0.0.1', '[::1]'].includes(host) || host.endsWith('.localhost'); }
export function resolveAuthRedirect({ appUrl, origin, allowLocal = false } = {}) {
  if (allowLocal && origin) {
    try { const url = new URL(origin); if (loopback(url.hostname) && ['http:', 'https:'].includes(url.protocol)) return new URL('/', url).href; } catch { /* Use the production destination. */ }
  }
  try {
    const url = new URL(appUrl);
    if (url.protocol === 'https:' && !loopback(url.hostname) && !url.username && !url.password) return new URL('/', url).href;
  } catch { /* An invalid setting must never send confirmation emails to localhost. */ }
  return PRODUCTION_APP_URL;
}
export function authRedirectUrl() {
  return resolveAuthRedirect({ appUrl: import.meta.env?.VITE_APP_URL, origin: typeof window === 'undefined' ? '' : window.location.origin, allowLocal: import.meta.env?.DEV === true && import.meta.env?.VITE_AUTH_USE_LOCAL === 'true' });
}
export function confirmationError(url) {
  const parsed = new URL(url), hash = new URLSearchParams(parsed.hash.slice(1));
  const code = hash.get('error_code') || parsed.searchParams.get('error_code');
  if (code === 'otp_expired') return 'Tautan verifikasi sudah kedaluwarsa atau telah dipakai. Coba masuk; jika belum terverifikasi, kirim ulang email verifikasi di bawah.';
  if (code || hash.has('error') || parsed.searchParams.has('error')) return 'Tautan verifikasi belum berhasil diproses. Coba masuk atau kirim ulang email verifikasi.';
  return '';
}
