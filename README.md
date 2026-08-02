# Paket Fitur: Undangan Takmir (Prioritas #3)

## Isi paket

```
supabase/migrations/
  016_aktifkan_batasi_undangan_lintas_langgar.sql   <- DISARANKAN
src/pages/undangan/
  undangan.html
  undangan.js
PATCH_router_rbac_whatsapp.txt                       <- WAJIB
README.md
```

## Cara menerapkan

1. Jalankan `016_aktifkan_batasi_undangan_lintas_langgar.sql` di SQL
   Editor Supabase (lihat penjelasan keamanan di bawah).
2. Salin folder `src/pages/undangan/` ke repo.
3. Terapkan `PATCH_router_rbac_whatsapp.txt` (3 bagian).
4. Halaman ini memakai `cetakSuratTakmirPDF` dari `src/lib/pdf.js`
   yang sudah dibuat di paket kop surat sebelumnya — pastikan file
   itu (dan `public/assets/kop/kop-al-muchtarom.png`) sudah ada di
   repo, kalau belum diterapkan.

## Cara kerja

- Sekretaris/Ketua Takmir membuat undangan (judul acara, isi, tanggal)
  lalu memilih penerima dari daftar warga.
- **Cetak PDF**: pakai kop Langgar Al Muchtarom, format 1 blok tanda
  tangan (Ketua Takmir) — mengikuti fungsi yang sudah disiapkan
  sebelumnya di `pdf.js`.
- **Kirim via WhatsApp**: membuka tab `wa.me` baru untuk tiap penerima
  yang punya nomor WA terdaftar (mengikuti pola `lib/whatsapp.js` yang
  sudah ada — tidak pakai API berbayar, pengurus tetap meninjau pesan
  sebelum kirim di aplikasi WhatsApp).

## Keamanan

Migrasi 016 mengaktifkan pembatasan scope per-langgar untuk tabel
`surat_undangan` & `undangan_penerima` (sebelumnya di migrasi 013
sengaja dibiarkan opsional/tidak aktif karena fiturnya belum ada
buktinya di kode). Sekarang setelah fitur ini nyata dipakai per-satu-
langgar (pola identik dengan Kas Takmir), pembatasan ini aman dan
disarankan — supaya daftar penerima undangan (nama warga yang
diundang ke acara apa) tidak terlihat oleh pengurus langgar lain.

## Keterbatasan saat ini (di luar cakupan paket ini)

- **Belum ada QR verifikasi** untuk undangan (tabel
  `qr_verifikasi_undangan` sudah ada di skema, tapi belum ada kode
  yang generate/scan QR-nya — sama seperti QR verifikasi surat yang
  juga belum diimplementasikan). Bisa jadi pengembangan lanjutan
  kalau dibutuhkan.
- Daftar penerima memilih dari SELURUH warga yang terlihat sesuai RLS
  `warga_select_scope` (berbasis RT, bukan langgar) — asumsi warga
  target undangan adalah warga di RT yang sama dengan wilayah langgar.
  Kalau jamaah langgar ternyata lintas-RT, perlu penyesuaian query.
