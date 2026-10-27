# Rachita Sign

Aplikasi tanda tangan PDF berbasis Next.js App Router. PDF asli dibaca, dirender, dan diekspor di browser pengguna. Server hanya dipakai untuk meneruskan gambar tanda tangan dari HP melalui sesi QR sementara.

## Menjalankan

```powershell
npm.cmd install
npm.cmd run dev
```

Buka `http://localhost:3000`. Untuk menguji QR dengan HP, buka aplikasi memakai alamat jaringan yang dapat diakses komputer dan HP, atau gunakan domain HTTPS. QR yang dibuat dari `localhost` hanya dapat dibuka pada perangkat yang sama.

## Fitur MVP

- Unggah PDF lokal hingga 20 MB dan 100 halaman, dengan validasi format, PDF rusak, dan dokumen terenkripsi.
- Render halaman dan thumbnail, navigasi halaman, zoom, dan pas halaman.
- Tanda tangan dengan mouse, stylus, atau sentuhan; serta kirim tanda tangan dari HP melalui QR.
- Tambah teks, stempel, kotak, lingkaran, garis, panah, dan coretan bebas.
- Pindah, ubah ukuran, rotasi, opasitas, warna, hapus, duplikasi, undo, dan redo elemen.
- Pratinjau PDF final sebelum unduh atau cetak. Hasil dibuat sebagai PDF baru sehingga file sumber tetap utuh.
- Dokumen baru membersihkan PDF, elemen, URL sementara, dan sesi QR aktif dari aplikasi. Tidak ada akun, database dokumen, atau penyimpanan otomatis ke localStorage/IndexedDB.

Tanda tangan yang ditempelkan adalah **tanda tangan visual**. Fitur ini bukan tanda tangan digital berbasis sertifikat atau tanda tangan elektronik tersertifikasi.

## QR dan deployment

Sesi QR memakai token acak 256-bit, kunci pemilik terpisah, masa berlaku 5 menit, satu kali penerimaan, batas payload 300 KB, dan penghapusan payload setelah diterima atau kedaluwarsa. PDF tidak pernah dikirim ke endpoint QR. Implementasi relay memakai memori proses Node.js, sehingga **jalankan satu instance server yang persisten**. Untuk deployment serverless atau beberapa instance, ganti penyimpanan sesi di `lib/qr-store.js` dengan shared store yang memiliki TTL, seperti Redis/Key Value.

Pembersihan sesi melepaskan referensi data dari aplikasi, tetapi tidak menjamin penghapusan salinan yang dibuat pengguna, cache sistem operasi, screenshot, atau swap.

## Struktur

- `app/page.jsx` dan `lib/editor-app.js`: UI editor dan interaksi browser.
- `lib/pdf-export.js`: penyematan elemen ke PDF final dengan koordinat halaman yang konsisten.
- `app/sign/[token]`: halaman tanda tangan HP.
- `app/api/qr` dan `lib/qr-store.js`: relay QR sementara.
- `public/pdf.worker.min.mjs`: worker PDF.js yang versinya mengikuti `pdfjs-dist` di `package-lock.json`.
- `public/rachita-logo.png`: logo dan favicon.

Tampilan dijalankan sepenuhnya lewat Next.js. Domain ngrok yang digunakan untuk pengujian development diizinkan pada `next.config.mjs`; sesuaikan daftar tersebut jika domain tunnel berubah, lalu mulai ulang server development.

## Pemeriksaan

```powershell
npm.cmd run build
npm.cmd run start -- -p 3100
# Pada terminal lain:
npm.cmd run test:smoke
```

Uji browser memeriksa PDF contoh, tanda tangan desktop dan HP, ekspor/unduh/cetak, undo/redo, navigasi dan ekspor dua halaman. Pengujian memakai Microsoft Edge yang terpasang di `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`.

Implementasi mengacu pada dokumentasi yang diperiksa lewat Context7: [Next.js Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route), [PDF.js](https://github.com/mozilla/pdfjs-dist), [pdf-lib](https://pdf-lib.js.org/), dan [node-qrcode](https://github.com/soldair/node-qrcode).
