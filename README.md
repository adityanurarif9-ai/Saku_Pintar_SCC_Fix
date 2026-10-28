# Saku_Pintar_SCC_Fix
bismilah SCC

React + Vite, Supabase Auth dan database per akun, serta dukungan instalasi PWA.

Jalankan `npm install`, `npm run dev`, dan `npm run build` untuk produksi.
Panduan pengaturan backend dan menu akun: [PANDUAN-SUPABASE.md](PANDUAN-SUPABASE.md).
Untuk instalasi baru jalankan migrasi 001, 002, dan 003 berurutan. Untuk proyek yang sudah aktif, jalankan hanya migrasi lanjutan yang belum diterapkan.

Jalankan juga migrasi 003 untuk maintenance terpusat dan perlindungan perubahan dompet selama pembaruan. Pengaturan ada di tab Admin; mulai dalam keadaan nonaktif. Konfirmasi email menggunakan alamat produksi, dengan tombol kirim ulang untuk tautan lama. Konfigurasi dan alur operasional dijelaskan di panduan Supabase. Pemeriksaan: `npm run test:maintenance`.

Pemeriksaan: `npm run test:db`, `npm run test:features`, `npm run test:account`.

Halaman **Statistik** tersedia pada navbar bawah. Pilih bulan untuk melihat arus kas, tren 6 bulan, pengeluaran per kategori, serta unduh laporan Excel (.xlsx) berisi 4 lembar. Ekspor dipindahkan dari Riwayat ke Statistik. Transfer tabungan dilaporkan terpisah; selisih arus kas bukan saldo akhir. Pengujian perhitungan dan pembacaan ulang Excel: `npm run test:statistics`.
