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
