# Paket Perbaikan Keamanan SILAT RT (v2 — disesuaikan dengan repo asli)

Paket ini sudah dicocokkan langsung dengan `silat-rt-main` (skema tabel,
nama fungsi helper, dan alur kode di `src/`) yang diunggah. Nomor file
migrasi melanjutkan urutan yang sudah ada di `supabase/migrations/`
(001-009), jadi tinggal dijalankan setelah migrasi 009.

## Isi paket

```
migrations/
  010_fix_riwayat_warga_rls.sql              <- WAJIB
  011_fix_log_aktivitas_audit.sql            <- WAJIB
  012_fix_trx_takmir_scope.sql               <- WAJIB (terbukti dari kode)
  013_optional_batasi_undangan_lintas_langgar.sql <- OPSIONAL, belum ada fiturnya
README.md                                     <- file ini
```

## Cara menjalankan

1. Backup database dulu (Supabase Dashboard > Database > Backups).
2. Buka **SQL Editor**, jalankan **010, 011, 012 secara berurutan** —
   masing-masing paste seluruh isi file, klik Run.
3. Verifikasi tiap migrasi sesuai instruksi di bagian bawah filenya.
4. **013 belum perlu dijalankan** — fitur undangan belum dibangun di
   kode (`src/pages/`), jadi belum ada risiko aktif. Simpan file ini
   untuk dipakai nanti begitu fitur undangan mulai dikerjakan.

## Ringkasan temuan (v2)

| # | Migrasi | Tabel | Masalah | Status |
|---|---------|-------|---------|--------|
| 1 | 010 | `riwayat_warga` | Subquery scope tidak memfilter apa pun — semua user login bisa baca riwayat semua warga lintas RT | 🔴 Wajib |
| 2 | 011 | `log_aktivitas` | Semua user login boleh INSERT bebas — audit trail bisa dipalsukan | 🔴 Wajib |
| 3 | 012 | `transaksi_keuangan_takmir` | Klausa `OR auth.role() = 'authenticated'` bikin transaksi semua langgar bocor lintas-langgar. **Dikonfirmasi lewat kode**: dashboard di `keuangan-takmir.js` didesain per-langgar (satu `langgarAktif`) tapi query tidak difilter, murni mengandalkan RLS | 🔴 Wajib |
| 4 | 013 | `surat_undangan`, `undangan_penerima` | Klausa serupa #3, tapi fitur undangan belum dibangun di UI — belum ada bukti apakah ini bug atau desain yang dituju | 🟡 Tunda, konfirmasi dulu |

## Koreksi dari paket sebelumnya

Paket versi pertama (sebelum saya melihat kode aslinya) salah menebak
skema kolom tabel `log_aktivitas` — memakai `tabel`/`record_id`/`detail
jsonb` yang sebenarnya tidak ada. Skema asli (`001_schema.sql`):
`user_id, aksi varchar(100), modul varchar(50), detail text,
ip_address varchar(45), created_at`. Migrasi 011 di paket ini sudah
disesuaikan dan siap dijalankan langsung tanpa error.

## Checklist keamanan lanjutan (di luar isi paket ini)

- [ ] Pastikan `service_role` key Supabase tidak pernah ikut ter-bundle
      ke kode frontend — cek `src/lib/supabaseClient.js` dan
      `.env.example` hanya memuat `anon` key.
- [ ] Endpoint pengajuan surat tanpa login (`surat_public_insert`,
      dipakai di `src/pages/surat/ajukan-surat-publik.js`) menerima
      NIK/nama/no HP pemohon tanpa verifikasi — pertimbangkan rate
      limiting per IP dan/atau verifikasi OTP sebelum status keluar
      dari `draf_publik`.
- [ ] Terapkan masking NIK/KK di tampilan UI untuk peran yang tidak
      perlu melihat nomor penuh.
- [ ] Siapkan draf kebijakan privasi sesuai UU PDP sebelum aplikasi
      dipublikasikan lebih luas ke warga.
