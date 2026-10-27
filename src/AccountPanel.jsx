import React, { useEffect, useRef, useState } from 'react';
import UserAvatar from './UserAvatar';
import InstallApp from './InstallApp';
import { BusyLabel } from './Loading';
import * as accountApi from './account-api';
import { avatarStyles, prepareAvatar, validProfileName, validateNewPassword } from './account-utils';

function MenuIcon({ type }) {
  const paths={profile:'M4 20a8 8 0 0 1 16 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',email:'M3 5h18v14H3V5Zm0 1 9 7 9-7',password:'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5V10Zm7 4v3',guide:'M4 3h12a4 4 0 0 1 4 4v14H8a4 4 0 0 1-4-4V3Zm0 12h12M9 7h6M9 10h4'};
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[type]||paths.profile}/></svg>;
}
function PasswordField({ name, label, visible, toggle, autoComplete, placeholder }) {
  return <label>{label}<div className="password-field"><input aria-label={label} name={name} type={visible?'text':'password'} autoComplete={autoComplete} placeholder={placeholder} maxLength={128} required/><button type="button" onClick={toggle} aria-label={visible?`Sembunyikan ${label.toLowerCase()}`:`Tampilkan ${label.toLowerCase()}`}>{visible?'Sembunyi':'Lihat'}</button></div></label>;
}

export default function AccountPanel({account,onClose,onReplayTutorial,closing,api=accountApi}) {
  const [view,setView]=useState('overview');
  const [name,setName]=useState(account.profile.display_name||'');
  const [style,setStyle]=useState(account.profile.avatar_style||'blue');
  const [photo,setPhoto]=useState(null);
  const [removePhoto,setRemovePhoto]=useState(false);
  const [busyAction,setBusyAction]=useState('');
  const [error,setError]=useState('');
  const [success,setSuccess]=useState('');
  const [showCurrent,setShowCurrent]=useState(false);
  const [showNew,setShowNew]=useState(false);
  const [needsNonce,setNeedsNonce]=useState(false);
  const panelRef=useRef(null),fileRef=useRef(null),titleRef=useRef(null),busyRef=useRef(false),closeRef=useRef(null);
  const busy=Boolean(busyAction)||closing;
  busyRef.current=busy;
  function navigate(next) {
    if(busyRef.current) return;
    setError('');setSuccess('');setShowCurrent(false);setShowNew(false);setNeedsNonce(false);
    if(next==='profile') {setName(account.profile.display_name||'');setStyle(account.profile.avatar_style||'blue');setPhoto(null);setRemovePhoto(false);}
    setView(next);
  }
  const back=()=>{if(!busyRef.current){if(view==='overview')onClose();else navigate('overview');}};
  closeRef.current=back;
  useEffect(()=>{
    const previous=document.activeElement,panel=panelRef.current;
    panel.focus();
    function keys(event) {
      if(event.key==='Escape'){event.preventDefault();closeRef.current();}
      if(event.key!=='Tab')return;
      const controls=[...panel.querySelectorAll('button:not(:disabled),input:not(:disabled):not([type="file"]),select:not(:disabled),a[href]')];
      const first=controls[0],last=controls.at(-1);
      if(!first){event.preventDefault();panel.focus();return;}
      if(event.shiftKey&&(document.activeElement===first||document.activeElement===panel)){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===panel)){event.preventDefault();first.focus();}
    }
    document.addEventListener('keydown',keys);
    return()=>{document.removeEventListener('keydown',keys);previous?.focus();};
  },[]);
  useEffect(()=>{titleRef.current?.focus();},[view]);
  useEffect(()=>()=>{if(photo?.url)URL.revokeObjectURL(photo.url);},[photo]);
  async function run(action,work) {
    if(busyRef.current)return;
    busyRef.current=true;setBusyAction(action);setError('');setSuccess('');
    try {await work();}
    catch(problem) {
      if(['reauthentication_needed','reauthentication_not_valid','reauthentication_failed'].includes(problem?.code))setNeedsNonce(true);
      setError(action==='photo'?'Foto tidak dapat diproses. Gunakan JPG, PNG, atau WebP maksimal 8 MB.':api.accountMessage(problem));
    }
    finally{busyRef.current=false;setBusyAction('');}
  }
  async function selectPhoto(event) {
    const file=event.target.files?.[0];event.target.value='';
    if(!file)return;
    await run('photo',async()=>{
      const blob=await prepareAvatar(file);
      setPhoto({blob,url:URL.createObjectURL(blob)});setRemovePhoto(false);
    });
  }
  async function saveProfile(event) {
    event.preventDefault();
    if(!validProfileName(name)){setError('Nama harus 1 sampai 60 karakter.');return;}
    await run('profile',async()=>{
      const next=await api.saveProfile({userId:account.user.id,name,style,photo:photo?.blob,removePhoto,previousPath:account.profile.avatar_path});
      account.applyProfile(next);setPhoto(null);setView('overview');setSuccess('Profil berhasil diperbarui.');
    });
  }
  async function savePassword(event) {
    event.preventDefault();
    const form=event.currentTarget,values=new FormData(form);
    const current=String(values.get('current')||''),password=String(values.get('password')||''),confirm=String(values.get('confirm')||'');
    const validation=validateNewPassword(current,password,confirm);
    if(validation){setError(validation);return;}
    await run('password',async()=>{
      await api.changePassword({email:account.profile.email,current,password,nonce:String(values.get('nonce')||'').trim()});
      form.reset();setShowCurrent(false);setShowNew(false);setNeedsNonce(false);setSuccess('Password berhasil diubah. Gunakan password baru saat masuk berikutnya.');
    });
  }
  async function saveEmail(event) {
    event.preventDefault();
    const form=event.currentTarget,values=new FormData(form),email=String(values.get('email')||'').trim();
    if(email.toLowerCase()===account.profile.email.toLowerCase()){setError('Email baru masih sama dengan email saat ini.');return;}
    if(email.toLowerCase()!==String(values.get('confirmEmail')||'').trim().toLowerCase()){setError('Konfirmasi email baru belum sama.');return;}
    await run('email',async()=>{
      await api.changeEmail({currentEmail:account.profile.email,password:String(values.get('current')||''),email});
      form.reset();setShowCurrent(false);setSuccess('Permintaan perubahan dikirim. Periksa email lama dan baru untuk konfirmasi. Email akun berubah setelah verifikasi selesai.');
    });
  }
  const titles={overview:'Akun Saya',profile:'Edit Profil',password:'Ganti Password',email:'Ubah Email'};
  const preview=photo?.url||(removePhoto?'':account.avatarUrl);
  return <section ref={panelRef} className={`account-panel${closing?' account-closing':''}`} role="dialog" aria-modal="true" aria-labelledby="account-title" tabIndex={-1}>
    <header className="account-header"><button onClick={back} disabled={busy} aria-label={view==='overview'?'Tutup pengaturan akun':'Kembali ke akun'}>‹</button><div><span>PENGATURAN</span><h2 id="account-title" ref={titleRef} tabIndex={-1}>{titles[view]}</h2></div></header>
    <div className="account-content" key={view}>
      {error&&<p className="auth-error" role="alert">{error}</p>}{success&&<p className="auth-message" role="status">{success}</p>}
      {view==='overview'&&<>
        <section className="account-identity"><UserAvatar src={account.avatarUrl} style={account.profile.avatar_style} size={86}/><h3>{account.profile.display_name||'Pengguna'}</h3><p>{account.profile.email}</p><span className="role-badge">{account.profile.role==='admin'?'Admin':'Pengguna'}</span><button className="edit-profile-link" onClick={()=>navigate('profile')}>Edit profil</button></section>
        <p className="account-group-label">PROFIL & KEAMANAN</p><div className="account-menu">{[['profile','Edit profil','Nama dan foto profilmu'],['email','Ubah email',account.profile.email],['password','Ganti password','Perbarui keamanan akun']].map(([type,title,detail])=><button key={type} onClick={()=>navigate(type)}><span className={`account-menu-icon icon-${type}`}><MenuIcon type={type}/></span><span><strong>{title}</strong><small>{detail}</small></span><span className="menu-chevron" aria-hidden="true">›</span></button>)}</div>
        <p className="account-group-label">BANTUAN</p><div className="account-menu"><button onClick={onReplayTutorial}><span className="account-menu-icon"><MenuIcon type="guide"/></span><span><strong>Panduan penggunaan</strong><small>Kenalan lagi dengan fitur SakuPintar</small></span><span className="menu-chevron" aria-hidden="true">›</span></button></div>
        <InstallApp compact/><button className="logout-button" disabled={busy} onClick={()=>run('logout',()=>account.signOut())}>{busyAction==='logout'?<BusyLabel>Keluar…</BusyLabel>:'Keluar dari Akun'}</button><p className="account-footer-note">Data dompet tersimpan di akunmu. Keluar hanya mengakhiri sesi pada perangkat ini.</p>
      </>}
      {view==='profile'&&<form onSubmit={saveProfile} aria-busy={busy}>
        <div className="avatar-editor"><UserAvatar src={preview} style={style} size={100}/><div className="avatar-edit-buttons"><button type="button" disabled={busy} onClick={()=>fileRef.current?.click()}>{busyAction==='photo'?<BusyLabel>Memproses…</BusyLabel>:'Ganti foto'}</button>{(photo||account.profile.avatar_path)&&!removePhoto&&<button type="button" disabled={busy} onClick={()=>{setPhoto(null);setRemovePhoto(true);}}>Hapus foto</button>}</div><input ref={fileRef} className="avatar-file-input" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Pilih foto profil" onChange={selectPhoto} disabled={busy}/><p>JPG, PNG, atau WebP. Maksimal 8 MB.</p></div>
        <label>Atau pilih avatar<div className="avatar-options">{avatarStyles.map((value,index)=><button key={value} aria-label={`Avatar ${['biru','hijau','ungu','peach'][index]}`} aria-pressed={!photo&&(!account.profile.avatar_path||removePhoto)&&style===value} className={!photo&&(!account.profile.avatar_path||removePhoto)&&style===value?'selected':''} type="button" disabled={busy} onClick={()=>{setStyle(value);setPhoto(null);setRemovePhoto(true);}}><UserAvatar style={value} size={44}/></button>)}</div></label>
        <label>Nama lengkap<input name="name" value={name} maxLength={60} autoComplete="name" disabled={busy} required onChange={event=>setName(event.target.value)} placeholder="Nama yang ditampilkan"/></label><p className="account-field-note">Nama ini tampil pada sapaan dan informasi akunmu.</p>
        <button className="full-button account-save" disabled={busy} type="submit">{busyAction==='profile'?<BusyLabel>Menyimpan profil…</BusyLabel>:'Simpan Profil'}</button><button type="button" className="cancel-button" disabled={busy} onClick={()=>navigate('overview')}>Batal</button>
      </form>}
      {view==='password'&&<>
        <div className="account-security-intro"><span className="account-menu-icon icon-password"><MenuIcon type="password"/></span><h3>Jaga akunmu tetap aman</h3><p>Masukkan password saat ini, lalu buat password baru minimal 8 karakter.</p></div>
        <form onSubmit={savePassword} aria-busy={busy}><fieldset disabled={busy}>
          <PasswordField name="current" label="Password saat ini" visible={showCurrent} toggle={()=>setShowCurrent(!showCurrent)} autoComplete="current-password" placeholder="Password yang sedang dipakai"/>
          <PasswordField name="password" label="Password baru" visible={showNew} toggle={()=>setShowNew(!showNew)} autoComplete="new-password" placeholder="Minimal 8 karakter"/>
          <label>Konfirmasi password baru<input name="confirm" type={showNew?'text':'password'} maxLength={128} autoComplete="new-password" placeholder="Ulangi password baru" required/></label>
          {needsNonce&&<div className="account-verification"><p>Supabase meminta kode verifikasi melalui email.</p><button type="button" onClick={()=>run('code',async()=>{await api.sendPasswordCode();setSuccess('Kode verifikasi dikirim. Periksa email akunmu.');})}>Kirim kode verifikasi</button><label>Kode verifikasi<input name="nonce" autoComplete="one-time-code" inputMode="numeric" maxLength={12} required/></label></div>}
          <button className="full-button account-save" type="submit">{busyAction==='password'?<BusyLabel>Mengubah password…</BusyLabel>:'Simpan Password Baru'}</button>
        </fieldset></form><button className="forgot-link account-forgot" disabled={busy} onClick={()=>run('reset',async()=>{await api.sendResetEmail(account.profile.email);setSuccess('Tautan pemulihan dikirim. Periksa kotak masuk dan spam email akunmu.');})}>{busyAction==='reset'?'Mengirim tautan…':'Lupa password saat ini? Kirim tautan pemulihan'}</button>
      </>}
      {view==='email'&&<>
        <div className="account-security-intro"><span className="account-menu-icon icon-email"><MenuIcon type="email"/></span><h3>Email untuk masuk ke akun</h3><p>Email saat ini: <strong>{account.profile.email}</strong></p></div>
        <form onSubmit={saveEmail} aria-busy={busy}><fieldset disabled={busy}><label>Email baru<input name="email" type="email" autoComplete="email" placeholder="Email baru kamu" maxLength={254} required/></label><label>Konfirmasi email baru<input name="confirmEmail" type="email" autoComplete="off" placeholder="Ulangi email baru" maxLength={254} required/></label><PasswordField name="current" label="Password saat ini" visible={showCurrent} toggle={()=>setShowCurrent(!showCurrent)} autoComplete="current-password" placeholder="Untuk memverifikasi akunmu"/><p className="account-field-note">Perubahan perlu dikonfirmasi melalui email. Jangan tutup akses ke email lama sebelum proses selesai.</p><button className="full-button account-save" type="submit">{busyAction==='email'?<BusyLabel>Mengirim konfirmasi…</BusyLabel>:'Kirim Konfirmasi Email'}</button></fieldset></form>
      </>}
    </div>
  </section>;
}
