# Paket: Perbaikan Bug Ajukan Surat + Widget Jam & Jadwal Sholat Global

## Isi paket

```
supabase/migrations/
  015_fix_ajukan_surat_publik.sql   <- WAJIB, perbaikan bug RLS
src/pages/surat/
  ajukan-surat-publik.js             <- pengganti file lama
src/lib/
  jadwalSholatHeader.js              <- widget baru
PATCH_index_dan_app.txt              <- WAJIB, pasang widget global
README.md
```

## 1. Perbaikan bug "new row violates row-level security policy for table surat"

**Penyebab**: proses pengajuan surat publik melakukan INSERT lalu
UPDATE terpisah sebagai role `anon`. INSERT-nya lolos, tapi UPDATE
status ke `menunggu_verifikasi` ditolak karena tidak ada policy UPDATE
yang mengizinkan `anon` (RLS memang sengaja membatasi ini hanya untuk
Ketua RT/Sekretaris RT/RW).

**Perbaikan**: satu fungsi database `ajukan_surat_publik()` yang
memvalidasi input lalu menyimpan langsung dengan status akhir
`menunggu_verifikasi` — tidak ada lagi langkah UPDATE terpisah dari
sisi client. Sekalian ini menutup celah lama: policy INSERT langsung
untuk `anon` juga dicabut (diganti fungsi ini), jadi tidak ada lagi
baris "menggantung" berstatus `draf_publik` yang tidak diverifikasi.

**Cara menerapkan**:
1. Jalankan `015_fix_ajukan_surat_publik.sql` di SQL Editor Supabase.
2. Timpa `src/pages/surat/ajukan-surat-publik.js` dengan versi baru.
3. Coba ajukan surat lagi dari halaman publik — seharusnya berhasil.

## 2. Widget Jam & Jadwal Sholat Global

Tampil di **semua halaman** (login, beranda publik, dan semua menu
untuk semua role setelah login) sebagai bar tipis di paling atas —
dipasang sekali di `index.html` (di luar area yang diganti-ganti
router), bukan ditempel satu-satu ke tiap halaman.

**Cara menerapkan**:
1. Salin `src/lib/jadwalSholatHeader.js` ke repo.
2. Ikuti `PATCH_index_dan_app.txt` (3 bagian: `index.html`,
   `components.css`, `app.js`).
3. **Prasyarat**: migrasi `014_public_select_langgar.sql` (dari paket
   fitur jadwal sholat sebelumnya) sudah diterapkan — kalau belum,
   widget ini juga butuh itu untuk baca koordinat langgar sebagai
   pengunjung yang belum login.

Widget ini terpisah dari halaman `/beranda-publik` (yang menampilkan
jadwal lengkap + bisa pilih tanggal) — widget global ini hanya
ringkasan: jam berjalan + waktu sholat berikutnya beserta hitung
mundur, cukup untuk selalu terlihat tanpa memakan banyak tempat.
