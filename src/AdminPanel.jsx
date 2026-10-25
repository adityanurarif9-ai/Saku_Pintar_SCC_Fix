import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

export default function AdminPanel() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    // Database checks the admin role again, even if frontend state is modified.
    supabase.rpc('admin_members').then(({ data, error }) => {
      if (!active) return;
      if (error) setError('Daftar pengguna belum bisa dimuat. Periksa koneksi dan akses admin.');
      else setMembers(data || []);
    }).catch(() => { if (active) setError('Tidak dapat menghubungi server.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  const visible = members.filter(member => `${member.display_name} ${member.email}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="admin-panel"><div className="section-heading"><h2>Panel Admin</h2><span className="role-badge">ADMIN</span></div><p className="admin-intro">Kelola informasi akun pengguna SakuPintar.</p>
    {loading ? <p role="status">Memuat pengguna…</p> : error ? <><p role="alert" className="auth-error">{error}</p><button className="full-button" onClick={() => setAttempt(value => value + 1)}>Coba Lagi</button></> : <>
      <div className="admin-stats"><article><strong>{members.length}</strong><span>Total akun</span></article><article><strong>{members.filter(member => member.role === 'admin').length}</strong><span>Admin</span></article></div>
      <label className="member-search">Cari pengguna<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nama atau email" /></label>
      <div className="member-list">{visible.map(member => <article key={member.id}><div><h3>{member.display_name || 'Pengguna'}</h3><p>{member.email}</p><small>Bergabung {new Date(member.created_at).toLocaleDateString('id-ID')}</small></div><span className="role-badge">{member.role === 'admin' ? 'Admin' : 'Pengguna'}</span></article>)}{!visible.length && <p className="empty-state">Tidak ada pengguna yang sesuai.</p>}</div>
    </>}
  </section>;
}
