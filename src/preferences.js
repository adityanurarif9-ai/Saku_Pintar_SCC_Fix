const key = userId => `sakupintar:preferences:v1:${userId}`;
export function readPreferences(userId) {
  try { const value = JSON.parse(localStorage.getItem(key(userId))); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
  catch { return {}; }
}
export function savePreference(userId, name, value) {
  try { localStorage.setItem(key(userId), JSON.stringify({ ...readPreferences(userId), [name]: value })); return true; }
  catch { return false; }
}
