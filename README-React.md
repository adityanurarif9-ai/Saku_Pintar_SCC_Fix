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

## Loading, tutorial, dan fitur harian

- Loading awal tersedia sebelum JavaScript selesai dimuat. Pemeriksaan sesi memakai splash beranimasi; pemuatan dompet memakai skeleton; proses login dan simpan memiliki spinner. Tidak ada durasi loading buatan.
- Tutorial empat langkah tampil setelah data akun berhasil dimuat untuk pertama kali di browser/perangkat tersebut. Bisa dilewati dan dibuka ulang melalui akun > Buka panduan penggunaan. Status tutorial disimpan di localStorage terpisah menurut ID pengguna; perangkat/browser lain akan mendapat tutorial lagi. Tidak ada perubahan schema Supabase.
- Tombol sembunyikan nominal menyamarkan angka di beranda, target, riwayat dan ringkasan kategori. Preferensinya disimpan per akun pada perangkat. Formulir transaksi tetap menunjukkan nominal untuk pengisian. Ini fitur tampilan, bukan enkripsi data.
- Riwayat dapat dicari berdasarkan nama, kategori dan catatan, lalu difilter menurut bulan dan jenis transaksi.
- Ekspor CSV mengikuti hasil filter, menyertakan nominal asli, dan melindungi kolom teks terhadap formula spreadsheet. File diunduh ke perangkat, tanpa dibagikan ke layanan lain.
- Ringkasan pengeluaran per kategori hanya menghitung transaksi pengeluaran pada bulan berjalan Asia/Jakarta. Transfer tabungan tidak dihitung sebagai pengeluaran.
- Perbarui memuat ulang data dari akun, dan notifikasi singkat memberi konfirmasi penyimpanan.

Komponen beranda kini di `src/Dashboard.jsx`; `src/main.jsx` hanya memasang gerbang autentikasi. Komponen baru: `Loading.jsx`, `Onboarding.jsx`, `History.jsx`, `ExpenseSummary.jsx`. Pengujian fitur: `npm run test:features`. Pengujian pembaruan PWA sesudah build: `node tests/pwa-update.mjs`.

Pemeriksaan antarmuka dilakukan memakai data contoh lokal; tidak membuat akun baru atau mengubah data Supabase pengguna.
