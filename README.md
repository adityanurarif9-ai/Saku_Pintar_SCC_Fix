# Saku_Pintar_SCC_Fix
bismilah SCC

React + Vite, Supabase Auth dan database per akun, serta dukungan instalasi PWA.

Jalankan `npm install`, `npm run dev`, dan `npm run build` untuk produksi.
Panduan pengaturan backend dan menu akun: [PANDUAN-SUPABASE.md](PANDUAN-SUPABASE.md).
Untuk instalasi baru jalankan migrasi 001, 002, dan 003 berurutan. Untuk proyek yang sudah aktif, jalankan hanya migrasi lanjutan yang belum diterapkan.

Jalankan juga migrasi 003 untuk maintenance terpusat dan perlindungan perubahan dompet selama pembaruan. Pengaturan ada di tab Admin; mulai dalam keadaan nonaktif. Konfirmasi email menggunakan alamat produksi, dengan tombol kirim ulang untuk tautan lama. Konfigurasi dan alur operasional dijelaskan di panduan Supabase. Pemeriksaan: `npm run test:maintenance`.

Pemeriksaan: `npm run test:db`, `npm run test:features`, `npm run test:account`.

Halaman **Statistik** tersedia pada navbar bawah. Pilih bulan untuk melihat arus kas, tren 6 bulan, pengeluaran per kategori, serta unduh laporan Excel (.xlsx) berisi 5 lembar dengan rincian dan rekap harian. Ekspor dipindahkan dari Riwayat ke Statistik. Transfer tabungan dilaporkan terpisah; selisih arus kas bukan saldo akhir. Pengujian perhitungan dan pembacaan ulang Excel: `npm run test:statistics`.

## Pembaruan anggaran dan riwayat

Beranda menyediakan batas pengeluaran bulanan: pengeluaran bulan berjalan dihitung menurut Asia/Jakarta, transfer celengan tidak ikut dihitung. Penanda peringatan muncul mulai 80% dan ketika batas terlampaui. Sisa alokasi harian dibagi jumlah hari tersisa termasuk hari ini; angka ini bukan saldo yang tersedia. Batas tersimpan per akun di penyimpanan browser perangkat ini, berlaku berulang setiap bulan, dan belum disinkronkan ke perangkat lain. Jika penyimpanan browser ditolak, formulir menampilkan kegagalan simpan.

Riwayat menyediakan urutan terbaru, terlama, atau nominal terbesar, tombol reset filter, serta total masuk, keluar, dan transfer sesuai hasil pencarian. Celengan menampilkan nominal yang masih dibutuhkan dan penanda target tercapai. Privasi nominal tetap mengikuti tombol sembunyikan pada beranda.

Pemeriksaan tambahan: `node --test tests/budget.mjs`. Contoh tampilan diuji memakai transaksi simulasi lokal; data akun produksi tidak diubah.

## Laporan detail untuk tugas siswa

Statistik menyediakan panel **Rekap keuangan lengkap** di dekat pilihan bulan. Pilih tanggal mulai dan selesai (maksimal 366 hari). Identitas nama, kelas, nomor absen, sekolah, dan refleksi opsional dimasukkan ke file unduhan, tidak disimpan sebagai profil atau dikirim ke layanan laporan lain.

Excel berisi Ringkasan, Transaksi, Rekap Harian, Kategori, dan Tren 6 Bulan. Rincian mencakup nomor, tanggal Excel asli, hari, jenis, keperluan/sumber uang, kategori, pemasukan, pengeluaran, transfer celengan, saldo berjalan, dan catatan. Saldo awal direkonstruksi dari seluruh riwayat sebelum periode dan saldo snapshot; saldo akhir mengurangi transfer tepat sekali. Rekap harian menampilkan setiap tanggal termasuk hari tanpa transaksi. Tren tetap memakai bulan penuh sampai bulan tanggal akhir dan diberi keterangan tersendiri. Nominal dalam file tetap lengkap meskipun privasi nominal aplikasi aktif.

Formulir pengeluaran dan transfer sekarang menyediakan tanggal serta catatan. Sumber pemasukan dapat ditulis lebih rinci. Tidak membutuhkan migrasi database baru. Pengujian `npm run test:statistics` mencakup saldo awal, transaksi sehari, batas periode, tahun kabisat, formula Excel, dan teks pengguna yang menyerupai formula.

## Desain email verifikasi

Template dan cara pemasangan tersedia di [PANDUAN-EMAIL-VERIFIKASI.md](PANDUAN-EMAIL-VERIFIKASI.md). File `supabase/templates/confirm-signup.html` harus disalin ke template **Confirm sign up** di dashboard Supabase; commit atau deploy frontend tidak memasangnya otomatis.

## Indikator kebiasaan belanja dan motivasi

Beranda menampilkan kartu Teman Atur Uangmu di bawah anggaran. Hasil berubah setelah transaksi atau batas anggaran diperbarui. Aturan sederhana terlihat di bagian Bagaimana penilaiannya: anggaran minimal 80% terpakai berarti Perlu dijaga; di atas batas berarti Melewati anggaran. Jika belum mendekati batas, pengeluaran maksimal 70% pemasukan bulan ini berarti Cenderung hemat. Pengeluaran melebihi pemasukan meminta evaluasi dengan catatan bahwa saldo bulan lalu mungkin digunakan. Tanpa pemasukan atau anggaran pembanding, hasil tetap Belum cukup data. Pemasukan saja tidak langsung dinilai hemat. Transfer tabungan bukan pengeluaran belanja.

Indikator hanya memakai transaksi bulan berjalan menurut Asia/Jakarta dan bukan penilaian pribadi, standar keuangan universal, atau kepastian bahwa semua pengeluaran sudah dicatat. Pengguna tetap dapat membaca alasan dan menyesuaikan anggaran untuk kebutuhan penting. Nominal mengikuti pengaturan sembunyikan saldo. Batas anggaran masih merupakan preferensi akun pada perangkat ini.

Tersedia 38 pesan semangat sesuai kondisi. Pilihan awal stabil untuk akun dan kumpulan transaksi yang sama; tombol Pesan semangat lain menggilir pesan tanpa pengulangan berurutan. Tidak membutuhkan layanan AI, biaya API baru, atau migrasi database. Pemeriksaan: `node --test tests/spending-coach.mjs tests/budget.mjs`.
