# Email verifikasi SakuPintar

Template ini mengatur isi email konfirmasi pendaftaran yang diterima di Gmail dan aplikasi email lain. HTML memakai tabel dan gaya inline, tombol verifikasi, logo PNG, teks pratinjau kotak masuk, tautan cadangan, serta petunjuk meminta tautan baru. Tidak memakai JavaScript, font eksternal, pelacak, atau tautan verifikasi buatan.

## Pasang di proyek Supabase SakuPintar

1. Buka proyek **SakuPintar**, bukan proyek FlexKas, di Supabase.
2. Buka **Authentication → Emails → Templates → Confirm sign up**. Pada dashboard yang berbeda namanya dapat tampil sebagai **Email Templates → Confirm signup**.
3. Cadangkan subject dan isi template yang sedang aktif agar bisa dikembalikan.
4. Isi **Subject**: `Verifikasi emailmu untuk mulai memakai SakuPintar`.
5. Pada editor **Source / HTML**, ganti isi dengan seluruh file `supabase/templates/confirm-signup.html`. Jangan menempel kode ke editor teks visual jika markup tampil sebagai tulisan biasa.
6. Simpan. Gunakan pratinjau Supabase untuk melihat hasilnya.
7. Pastikan **Authentication → URL Configuration → Site URL** dan daftar **Redirect URLs** memuat `https://saku-pintar-scc-fix.vercel.app/`. Kode aplikasi tetap mengirim `emailRedirectTo` melalui fungsi yang menolak localhost pada produksi.
8. Untuk memeriksa pengiriman sungguhan, pemilik akun mendaftar atau meminta satu email baru melalui SakuPintar. Periksa logo, subject, tombol, tautan cadangan, dan tampilan Gmail HP. Gunakan email terbaru. Email yang telah terkirim tidak berubah setelah template disimpan.

## Penting untuk pengaturan

- Pertahankan `{{ .ConfirmationURL }}` persis seperti di file. Supabase menggantinya dengan tautan verifikasi bertoken; jangan mengganti href tombol dengan alamat beranda, `{{ .SiteURL }}`, atau URL localhost. Tidak diperlukan endpoint konfirmasi baru.
- Tampilan isi email terpisah dari nama/alamat pengirim. Untuk mengubah pengirim, gunakan **Authentication → Emails → SMTP Settings → Sender name: SakuPintar**, beserta alamat pengirim terverifikasi dari penyedia SMTP milikmu. Jangan memasukkan password atau key SMTP ke kode frontend.
- Logo mengambil gambar publik aplikasi yang sekarang. Jika pindah domain, ubah alamat gambar di template sesudah aset pada domain baru tersedia melalui HTTPS. Jika penerima memblokir gambar, nama aplikasi dan tombol verifikasi tetap berupa teks.
- Desain ini tidak mengubah kuota atau izin pengiriman email. Jika email gagal terkirim, lihat bagian SMTP dan batas pengiriman di `PANDUAN-SUPABASE.md`.
- File HTML di Git tidak otomatis memperbarui template proyek Supabase yang dihosting. Template harus disimpan di dashboard. Pemasangan template saja tidak mengubah database maupun men-deploy aplikasi.

Referensi: https://supabase.com/docs/guides/auth/auth-email-templates
