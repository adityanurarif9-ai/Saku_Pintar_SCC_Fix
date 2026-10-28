import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import { OPEN_STATUS, parseRuntimeStatus } from './runtime-utils';

const runtimeApi = {
  async load(signal) {
    if (!supabase) return OPEN_STATUS;
    const { data, error } = await supabase.rpc('app_runtime_status').abortSignal(signal);
    if (error) throw error;
    return parseRuntimeStatus(data);
  },
  async update(enabled, message) {
    const { data, error } = await supabase.rpc('set_app_maintenance', { p_enabled: enabled, p_message: message });
    if (error) throw error;
    return parseRuntimeStatus(data);
  },
};
export default function useRuntimeStatus(api = runtimeApi) {
  const [status, setStatus] = useState(OPEN_STATUS);
  const [checked, setChecked] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(false), request = useRef(null), sequence = useRef(0), updating = useRef(false);
  const refresh = useCallback(async () => {
    if (request.current || updating.current) return;
    const controller = new AbortController(), revision = ++sequence.current;
    request.current = controller; setRefreshing(true);
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const next = parseRuntimeStatus(await api.load(controller.signal));
      if (mounted.current && revision === sequence.current) { setStatus(next); setError(''); }
    } catch {
      if (mounted.current && revision === sequence.current) setError('Status aplikasi belum bisa diperbarui. Periksa koneksi dan coba lagi.');
    } finally {
      clearTimeout(timeout); if (request.current === controller) request.current = null;
      if (mounted.current && revision === sequence.current) { setRefreshing(false); setChecked(true); }
    }
  }, [api]);
  useEffect(() => {
    mounted.current = true; refresh();
    const visible = () => { if (document.visibilityState === 'visible') refresh(); };
    const timer = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 30000);
    document.addEventListener('visibilitychange', visible); window.addEventListener('online', refresh);
    return () => { mounted.current = false; clearInterval(timer); request.current?.abort(); request.current = null; document.removeEventListener('visibilitychange', visible); window.removeEventListener('online', refresh); };
  }, [refresh]);
  const update = useCallback(async (enabled, message) => {
    if (updating.current) throw new Error('Pengaturan sedang disimpan.');
    updating.current = true; request.current?.abort();
    const revision = ++sequence.current;
    try {
      const next = parseRuntimeStatus(await api.update(enabled, message));
      if (mounted.current && revision === sequence.current) { setStatus(next); setChecked(true); setError(''); }
      return next;
    } finally { updating.current = false; if (mounted.current) setRefreshing(false); }
  }, [api]);
  return { status, checked, refreshing, error, refresh, update };
}
