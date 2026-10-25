# Mengaktifkan login admin dan pengguna

Kode login, database dompet per akun, dan panel admin sudah disiapkan. Karena proyek Supabase belum dibuat, versi tanpa konfigurasi hanya menampilkan halaman sign in dengan pemberitahuan pengaturan; tombol autentikasi dinonaktifkan. Tidak ada akun/password bawaan atau jalan pintas masuk.

## 1. Buat proyek

1. Buka https://supabase.com/dashboard dan buat proyek SakuPintar. Simpan password database milikmu sendiri; password ini tidak dibutuhkan aplikasi React.
2. Di SQL Editor, jalankan seluruh isi `supabase/001_auth_wallet.sql` **sekali**. Script membuat tabel profil, dompet, tabungan, transaksi, trigger akun baru, fungsi dompet dan kebijakan RLS. Jangan jalankan pada proyek lain yang sudah mempunyai tabel dengan nama sama.
3. Pada pengaturan API / Connect, salin **Project URL** dan **publishable key**. Legacy anon key juga bisa dipakai bila proyek masih menggunakannya. Jangan gunakan secret key atau service_role key di frontend.

## 2. Konfigurasi lokal

Salin `.env.example` menjadi `.env.local`, kemudian isi:

```dotenv
VITE_SUPABASE_URL=https://PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_KEY_PROYEK_KAMU
```

Jalankan `npm install` lalu `npm run dev`. Jika server sudah berjalan saat `.env.local` diubah, hentikan lalu jalankan kembali. File `.env.local` diabaikan oleh Git; jangan mengirim password lewat chat atau memasukkannya ke kode.

## 3. Konfigurasi email dan URL

1. Di Authentication, aktifkan provider Email/password dan konfirmasi email.
2. Di URL Configuration, isi Site URL dengan alamat HTTPS produksi SakuPintar di Vercel.
3. Tambahkan alamat root produksi dan `http://127.0.0.1:5173/` ke Redirect URLs. Bila memakai port lokal lain, tambahkan URL yang sesuai. Tautan konfirmasi dan pemulihan kembali ke root aplikasi.
4. Daftar akun dari aplikasi, buka email konfirmasi, kemudian masuk. Fitur Lupa password mengirim tautan untuk membuat password baru. Gunakan layanan SMTP milikmu untuk pengiriman email produksi; ikuti batas pengiriman dan konfigurasi pada dashboard Supabase.

## 4. Jadikan akunmu admin

Daftar akun biasa dengan emailmu dan selesaikan konfirmasi terlebih dahulu. Di SQL Editor milik pengelola, ganti email contoh di bawah dengan email akun tersebut:

```sql
update public.profiles
set role = 'admin'
where lower(email) = lower('EMAIL_ADMIN_KAMU')
returning id, email, role;
```

Pastikan hasilnya tepat satu akun yang dimaksud. Jika tidak ada hasil, akun belum terdaftar atau email tidak sesuai. Keluar lalu masuk kembali agar profil dibaca ulang. Akun admin akan mendapat tab **Admin** dengan jumlah akun, daftar pengguna, dan pencarian nama/email. Semua akun baru selalu `user`, meskipun metadata pendaftaran mencoba mengirim peran admin.

Panel admin saat ini hanya membaca daftar profil. Pengubahan peran, penghapusan akun, dan reset password orang lain tidak disediakan. Admin tidak memperoleh akses ke data dompet pengguna lain. Pengubahan peran tetap melalui pengelola database.

## 5. Aktifkan di Vercel

1. Buka project Vercel yang terhubung dengan repositori ini.
2. Di Settings → Environment Variables, tambahkan kedua variabel `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` untuk environment yang digunakan.
3. Lakukan **Redeploy**. Variabel Vite dibaca ketika build; perubahan variabel tanpa build ulang belum mengubah aplikasi.
4. Jika pernah memasang PWA versi lama, tutup semua jendela/tab SakuPintar lalu buka kembali agar service worker baru aktif. Jangan menghapus data browser hanya untuk pembaruan.

## Data dan koneksi

- Pengguna baru mulai dari saldo Rp0 dengan riwayat dan target kosong.
- Data demo lama di localStorage tidak diimpor otomatis dan tidak dipakai sebagai data akun.
- Transaksi disimpan di database dengan pemeriksaan saldo dan kepemilikan target pada server. Ringkasan bulanan mengikuti bulan Asia/Jakarta.
- Password ditangani Supabase Auth. Frontend menyimpan sesi melalui SDK resmi; tidak menyimpan daftar password sendiri.
- PWA tetap bisa menampilkan berkas aplikasi secara offline, tetapi login, pemeriksaan profil, daftar admin, dan transaksi memerlukan internet. Data dompet tidak dicache oleh service worker. Jika server tidak dapat dihubungi, aplikasi menampilkan kegagalan dan opsi coba lagi.
- Logout mengakhiri sesi lokal perangkat ini, bukan semua perangkat.

## Pemeriksaan setelah dihubungkan

1. Daftar dua akun pengguna yang berbeda dan satu akun yang dijadikan admin.
2. Pastikan konfirmasi email, masuk, logout, dan pemulihan password berhasil.
3. Masukkan transaksi pada pengguna A; logout dan masuk sebagai B. Data A harus tidak muncul.
4. Akun B tidak memiliki tab Admin. Admin dapat melihat daftar profil, sementara data dompetnya tetap milik akun admin sendiri.
5. Coba pengeluaran melebihi saldo: transaksi harus ditolak tanpa mengubah saldo.

Build dan pengujian SQL lokal dapat dijalankan tanpa proyek Supabase. Pengujian email, sesi Supabase sungguhan, dan instalasi PWA pada HP harus dilakukan setelah konfigurasi layanan selesai.

Referensi resmi: [Auth React](https://supabase.com/docs/guides/auth/quickstarts/react), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [pengelolaan profil pengguna](https://supabase.com/docs/guides/auth/managing-user-data).
