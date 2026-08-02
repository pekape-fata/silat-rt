# Paket Fitur: Jadwal Sholat Sepanjang Masa (Halaman Depan Publik)

Prioritas #2 — disesuaikan dari rencana awal (menu "Jadwal" khusus
Imam/Takmir yang login) menjadi **halaman depan publik tanpa login**,
sesuai instruksi terbaru.

## Isi paket

```
supabase/migrations/
  014_public_select_langgar.sql   <- WAJIB, buka akses baca nama/lokasi langgar untuk publik
src/pages/beranda-publik/
  beranda-publik.html
  beranda-publik.js
PATCH_router.txt                  <- WAJIB, jadikan beranda publik sebagai halaman depan
README.md
```

## Cara menerapkan

1. Jalankan `014_public_select_langgar.sql` di SQL Editor Supabase.
2. Salin folder `src/pages/beranda-publik/` ke repo.
3. Terapkan `PATCH_router.txt` ke `src/router.js`.
4. **Pastikan kolom `latitude`/`longitude` di tabel `langgar` sudah
   diisi** — tanpa ini jadwal tidak bisa dihitung (halaman akan
   menampilkan pesan "koordinat belum diatur"). Cek/isi lewat SQL
   Editor:
   ```sql
   update public.langgar
   set latitude = -7.9535, longitude = 112.6614  -- contoh, GANTI dengan koordinat asli
   where nama_langgar = 'Langgar Waqaf Al Muchtarom';
   ```
   (Koordinat asli bisa diambil dari Google Maps — klik kanan lokasi
   langgar di peta, salin angka lat/long yang muncul.)

## Cara kerja "Sepanjang Masa"

Jadwal **dihitung langsung di browser** dari koordinat langgar pakai
library `adhan` (metode Kemenag RI/MoonsightingCommittee — pendekatan
yang umum dipakai di Indonesia), bukan dibaca dari tabel cache harian
`jadwal_sholat_cache`. Konsekuensinya:

- Bisa tampilkan jadwal untuk **tanggal berapa pun** (lewat date
  picker di halaman), termasuk tanggal jauh ke depan/belakang —
  tidak tergantung apakah data pernah di-cache atau tidak.
- Tidak butuh panggilan API eksternal (Aladhan dst.) sama sekali
  untuk fitur ini — murni perhitungan matematis dari lokasi.
- Tabel `jadwal_sholat_cache` yang sudah ada tetap bisa dipakai nanti
  kalau Imam ingin melakukan **koreksi manual** (mis. maju/mundur
  beberapa menit sesuai kebiasaan setempat) — halaman ini belum
  mengecek cache tersebut sebagai override, disiapkan sebagai langkah
  lanjutan kalau dibutuhkan.

## Keamanan

Migrasi 014 membuka akses baca (SELECT) tabel `langgar` untuk
pengunjung tanpa login. Ini aman karena kolom-kolomnya (nama, alamat,
koordinat, foto, sejarah/visi/misi) memang informasi publik institusi
— setara dengan info yang sudah tercetak di kop surat resmi, bukan
data pribadi warga. Policy INSERT/UPDATE/DELETE tetap seperti semula
(hanya admin/pengurus terkait).

## Langkah berikutnya

Prioritas #3: **Undangan Takmir** (pakai kop Langgar Al Muchtarom yang
sudah disiapkan). Beri tahu saya kapan mau lanjut.
