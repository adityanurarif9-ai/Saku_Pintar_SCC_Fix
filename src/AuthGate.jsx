import React, { useEffect, useState } from 'react';
import AuthScreen from './AuthScreen';
import { supabase, authConfigured } from './supabase';
import LoadingScreen from './Loading';
import { avatarUrl as loadAvatarUrl } from './account-api';

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(authConfigured);
  const [profile, setProfile] = useState(null);
  const [problem, setProblem] = useState('');
  const [recovery, setRecovery] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState('');
  useEffect(() => {
    if (!supabase) return;
    let active = true, authEvent = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      authEvent = true;
      if (!active) return;
      setSession(next); setChecking(false); setProblem('');
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      if (event === 'SIGNED_OUT') { setRecovery(false); setProfile(null); }
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active || authEvent) return;
      if (error) setProblem('Sesi belum bisa diperiksa. Coba muat ulang.');
      else setSession(data.session);
      setChecking(false);
    }).catch(() => { if (active) { setProblem('Tidak dapat memeriksa sesi. Periksa koneksi internet.'); setChecking(false); } });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    setProfile(current => current?.id === session?.user.id ? current : null);
    if (!session) return;
    let active = true;
    supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data, error }) => {
      if (!active) return;
      if (error || !data || !['admin', 'user'].includes(data.role)) setProblem('Profil belum dapat dimuat. Periksa koneksi atau minta pengelola menyelesaikan konfigurasi database.');
      else { setProfile(data); setProblem(''); }
    }).catch(() => { if (active) setProblem('Profil gagal dimuat. Periksa koneksi internet.'); });
    return () => { active = false; };
  }, [session?.user.id, session?.access_token, attempt]);
  useEffect(() => {
    let active=true;
    setAvatarUrl('');
    const path=profile?.avatar_path,id=profile?.id;
    if(!path||!id)return;
    const refresh=()=>loadAvatarUrl(path,id).then(url=>{if(active)setAvatarUrl(url);}).catch(()=>{});
    refresh();
    const timer=setInterval(refresh,50*60*1000);
    const visible=()=>{if(document.visibilityState==='visible')refresh();};
    document.addEventListener('visibilitychange',visible);
    return()=>{active=false;clearInterval(timer);document.removeEventListener('visibilitychange',visible);};
  },[profile?.id,profile?.avatar_path]);
  function applyProfile(next) {
    if(next?.id!==session?.user.id||!['admin','user'].includes(next.role))return;
    setProfile(current=>current?.id===next.id?next:current);
  }
  async function signOut() {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
    setProfile(null); setSession(null); setRecovery(false);
  }
  if (problem && !recovery) return <div className="app-shell auth-shell"><main className="auth-main"><section className="auth-card"><h1>Belum terhubung</h1><p className="auth-error" role="alert">{problem}</p><button className="full-button" onClick={() => { setProblem(''); if (session) setAttempt(value => value + 1); else window.location.reload(); }}>Coba Lagi</button>{session && <button className="cancel-button" onClick={() => signOut().catch(() => setProblem('Keluar belum berhasil. Coba lagi.'))}>Keluar</button>}</section></main></div>;
  if (recovery) return <AuthScreen key="reset" recovery onRecovered={() => setRecovery(false)} />;
  if (checking || (session && (!profile || profile.id !== session.user.id))) return <LoadingScreen label={checking ? 'Memeriksa sesi akunmu…' : 'Menyiapkan profil dan dompetmu…'} />;
  if (!session) return <AuthScreen />;
  return children({ user: session.user, profile, avatarUrl, applyProfile, signOut });
}
