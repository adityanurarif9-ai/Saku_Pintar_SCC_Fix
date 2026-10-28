export const DEFAULT_MAINTENANCE_MESSAGE = 'Kami sedang memperbarui SakuPintar agar lebih nyaman digunakan. Coba lagi sebentar, ya.';
export const OPEN_STATUS = { maintenance: false, message: DEFAULT_MAINTENANCE_MESSAGE, updated_at: null };
export function parseRuntimeStatus(value) {
  if (!value || typeof value.maintenance !== 'boolean' || typeof value.message !== 'string' || !value.message.trim() || value.message.length > 240) throw new Error('Status aplikasi tidak valid.');
  return { maintenance: value.maintenance, message: value.message, updated_at: typeof value.updated_at === 'string' ? value.updated_at : null };
}
export function requiresMaintenance(status, profile) { return status.maintenance === true && profile?.role !== 'admin'; }
