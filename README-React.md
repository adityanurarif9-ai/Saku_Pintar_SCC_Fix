# SakuPintar SCC — React JS

Halaman beranda berdasarkan gambar referensi. Dibuat menggunakan React dan Vite, tanpa library UI tambahan.

## Menjalankan

```powershell
cd D:\Saaku_Pintar_Scc\Saku_Pintar_SCC_Fix
npm install
npm run dev
```

Buka alamat Local yang muncul di terminal. Untuk hasil produksi, jalankan `npm run build`. Untuk memeriksa build, jalankan `npm run preview`.

## Isi proyek

- `src/main.jsx`: komponen dan interaksi beranda, celengan, riwayat, serta formulir.
- `src/styles.css`: tampilan sesuai referensi dan penyesuaian layar ponsel.
- `index.html`: dokumen utama.

Saldo awal dan transaksi adalah data contoh. Tombol tambah saldo, catat pengeluaran, tambah target, dan transfer dapat digunakan. Perubahan disimpan di localStorage browser yang sama; belum ada backend atau login. Transfer mengurangi saldo dan menambah isi target, tanpa dihitung sebagai pengeluaran. Ringkasan bulanan merupakan angka demo awal ditambah transaksi yang dimasukkan, belum menghitung pergantian bulan. Halaman lanjutan bisa dikembangkan dari state `tab` di `App`.


## Pembaruan logo dan formulir

Logo asli berada di `public/saku-pintar-logo.png`, digunakan pada header dan favicon. Komponen `src/TransactionSheet.jsx` berisi panel Tambah Saldo, Catat Pengeluaran, Buat Target Baru, serta transfer.

- Pemasukan: nominal rupiah, sumber, tanggal dan catatan opsional.
- Pengeluaran: nama, nominal dan kategori, dengan pencegahan saldo negatif.
- Target: nama, target nominal, nominal awal dan target tanggal/catatan opsional. Nominal awal diambil dari saldo tersedia dan dicatat sebagai transfer.
- Panel mendukung tombol Batal, Escape, klik latar, dan navigasi fokus keyboard.

Penyimpanan masih menggunakan localStorage pada browser, tanpa backend. Tanggal/catatan target berupa isian teks bebas sesuai referensi.

## Aplikasi PWA

Layout HP memenuhi lebar dan tinggi layar tanpa bingkai. Header dan navigasi bawah tetap terlihat; bagian isi dapat digulir. Safe area perangkat dan perubahan tinggi layar didukung.

Untuk memasang di Android, buka URL HTTPS di Chrome lalu menu > Instal aplikasi / Tambahkan ke layar utama. Setelah dipasang, buka dari ikon SakuPintar. Petunjuk dan tombol pasang (jika disediakan browser) ada di tombol akun kanan atas. Safari iPhone: Bagikan > Tambahkan ke Layar Utama.

Build produksi menghasilkan `dist/sw.js` melalui `scripts/build-sw.mjs`. Seluruh berkas aplikasi disimpan di cache saat service worker selesai dipasang, sehingga aplikasi bisa dibuka offline. `npm run dev` tidak mengaktifkan service worker; gunakan `npm run build` lalu `npm run preview` untuk mengujinya. HTTPS diperlukan saat hosting; localhost dapat dipakai untuk pengembangan. Untuk menerima versi baru, tutup semua jendela aplikasi lalu buka kembali. Data transaksi lokal tetap dipertahankan.

Build dan pengujian cache offline otomatis berhasil. Pemasangan langsung pada perangkat Android/iPhone belum diverifikasi.

## Animasi dan pemasangan dari beranda

Transisi halaman dan kartu memakai fade/slide singkat. Panel memiliki animasi masuk dan keluar, dengan penutupan 180 ms dan penjagaan agar transaksi tidak disimpan dua kali saat panel menutup. Tombol memiliki umpan balik sentuhan dan perubahan progress tabungan menggunakan transisi. Seluruh gerakan dinonaktifkan saat perangkat memilih reduced motion.

Kartu pemasangan kini tersedia di beranda. Bila prompt browser tersedia, tombol memanggil instalasi; bila belum tersedia, tombol membuka panduan Android/iPhone. Pengguna tetap harus mengonfirmasi pemasangan di HP. Kartu disembunyikan ketika aplikasi dibuka dalam mode standalone atau browser mengirim appinstalled.
