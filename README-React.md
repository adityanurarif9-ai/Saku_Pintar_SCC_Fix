# SakuPintar — React + Supabase

Aplikasi uang saku berbasis React/Vite dengan PWA, sign in email/password, daftar akun, pemulihan password, logout, dompet per akun dan panel admin.

## Mengaktifkan akun

Ikuti **[PANDUAN-SUPABASE.md](PANDUAN-SUPABASE.md)**. Buat proyek Supabase, jalankan `supabase/001_auth_wallet.sql`, lalu isi `.env.local` berdasarkan `.env.example`. Login tetap dinonaktifkan sampai konfigurasi tersedia. Tidak ada akun atau password admin bawaan; promosi akun admin dilakukan oleh pengelola melalui SQL Editor.

## Menjalankan

```powershell
cd D:\Saaku_Pintar_Scc\Saku_Pintar_SCC_Fix
npm install
npm run dev
```

Build produksi: `npm run build`. Preview produksi/PWA: `npm run preview`.
Pengujian PostgreSQL lokal untuk RLS dan aturan dompet: `npm run test:db`.

## Akses dan penyimpanan

- Halaman sign in tampil sebelum beranda. Pengguna baru mulai dengan saldo Rp0.
- Profil akun menentukan peran admin/pengguna. RLS dan fungsi database memeriksa akses di server.
- Tab Admin menampilkan daftar profil dan pencarian. Admin tidak dapat membaca dompet pengguna lain.
- Transaksi dan target disimpan di Supabase. Data demo lama di localStorage tidak diimpor otomatis.
- Password ditangani Supabase Auth; sesi perangkat dikelola SDK resmi.
- PWA dapat menyimpan berkas aplikasi untuk offline. Login, profil dan transaksi memerlukan internet; dompet tidak dicache oleh service worker.
- Tampilan mendukung layar HP, navigasi bawah, animasi panel dan pengaturan reduced motion.

## Berkas utama

- `src/AuthGate.jsx`, `src/AuthScreen.jsx`: gerbang sesi dan formulir akun.
- `src/supabase.js`: client Supabase dari konfigurasi lingkungan.
- `src/main.jsx`, `src/wallet-api.js`: beranda dan transaksi server.
- `src/AdminPanel.jsx`: daftar akun khusus admin.
- `src/TransactionSheet.jsx`: formulir dompet dan logout.
- `src/InstallApp.jsx`: pemasangan aplikasi ke layar utama.
- `supabase/001_auth_wallet.sql`: schema, trigger, RLS dan RPC.
- `tests/auth-wallet.mjs`: pengujian SQL lokal dengan PGlite.

Tidak ada secret key yang perlu diletakkan di frontend. Gunakan publishable key; jangan gunakan service_role key.
