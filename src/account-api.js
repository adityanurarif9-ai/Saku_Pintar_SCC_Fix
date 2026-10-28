import { createClient } from '@supabase/supabase-js';
import { supabase, authMessage } from './supabase';
import { avatarStyles, ownedAvatar, validProfileName } from './account-utils';
import { authRedirectUrl } from './auth-urls';

export const AVATAR_BUCKET='saku-avatars';
export function accountMessage(error) {
  if(error?.accountMessage) return error.message;
  if(error?.code==='PGRST202' || error?.code==='42703') return 'Pengaturan profil belum aktif. Hubungi pengelola aplikasi.';
  if(error?.code==='reauthentication_needed') return 'Verifikasi email diperlukan. Kirim kode, lalu masukkan kode yang diterima.';
  if(['reauthentication_not_valid','reauthentication_failed'].includes(error?.code)) return 'Kode verifikasi belum cocok atau sudah kedaluwarsa. Kirim kode baru.';
  return authMessage(error);
}
function fail(message) { const error=new Error(message);error.accountMessage=true;throw error; }
export async function avatarUrl(path,userId) {
  if(!ownedAvatar(path,userId)) return '';
  const {data,error}=await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path,3600);
  return error?'':data.signedUrl;
}
export async function saveProfile({userId,name,style,photo,removePhoto,previousPath}) {
  if(!validProfileName(name)) fail('Nama harus 1 sampai 60 karakter.');
  if(!avatarStyles.includes(style)) fail('Pilih avatar yang tersedia.');
  let path=removePhoto?null:(previousPath||null),uploaded=null;
  if(photo) {
    path=`${userId}/${crypto.randomUUID()}.jpg`;
    const {error}=await supabase.storage.from(AVATAR_BUCKET).upload(path,photo,{contentType:'image/jpeg',upsert:false,cacheControl:'3600'});
    if(error) fail('Foto belum berhasil diunggah. Periksa koneksi atau coba foto lain.');
    uploaded=path;
  }
  const {data,error}=await supabase.rpc('update_my_profile',{p_name:name.trim(),p_avatar_path:path,p_avatar_style:style});
  if(error) {
    if(uploaded) await supabase.storage.from(AVATAR_BUCKET).remove([uploaded]).catch(()=>{});
    throw error;
  }
  if(previousPath && previousPath!==path && ownedAvatar(previousPath,userId)) {
    // Profile changes already succeeded; cleanup must not turn a saved profile into a failure.
    await supabase.storage.from(AVATAR_BUCKET).remove([previousPath]).catch(()=>{});
  }
  return data;
}
async function verifyPassword(email,password) {
  const verifier=createClient(import.meta.env.VITE_SUPABASE_URL.trim(),import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY.trim(),{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,storageKey:'saku-password-verification'}});
  const {data,error}=await verifier.auth.signInWithPassword({email,password});
  if(error) { if(error.code==='invalid_credentials') fail('Password saat ini belum benar.'); throw error; }
  if(!data.session) fail('Password belum dapat diverifikasi.');
  await verifier.auth.signOut({scope:'local'});
}
export async function changePassword({email,current,password,nonce}) {
  await verifyPassword(email,current);
  const {error}=await supabase.auth.updateUser({password,current_password:current,...(nonce?{nonce}:{} )});
  if(error) throw error;
}
export async function changeEmail({currentEmail,password,email}) {
  await verifyPassword(currentEmail,password);
  const {error}=await supabase.auth.updateUser({email},{emailRedirectTo:authRedirectUrl()});
  if(error) throw error;
}
export async function sendPasswordCode() { const {error}=await supabase.auth.reauthenticate(); if(error) throw error; }
export async function sendResetEmail(email) { const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:authRedirectUrl()}); if(error) throw error; }
