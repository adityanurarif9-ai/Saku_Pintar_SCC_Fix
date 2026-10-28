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

export { authMessage } from './auth-errors';
