export function installPlatform({ userAgent = '', platform = '', maxTouchPoints = 0 } = {}) {
  if (/iPad|iPhone|iPod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)) return 'ios';
  return /Android/i.test(userAgent) ? 'android' : 'other';
}
