# TAHAP 5 — STRUKTUR DATABASE SUPABASE
## SILAT RT (Sistem Informasi Langgar dan RT)

Tahap ini menghasilkan 3 file SQL yang dijalankan berurutan di **Supabase SQL Editor**, ditambah ringkasan Auth, Storage, dan Realtime.

---

## 1. URUTAN EKSEKUSI FILE

| Urutan | File | Isi |
|---|---|---|
| 1 | `05a-schema-SILAT-RT.sql` | Semua `CREATE TABLE`, index, constraint, trigger `updated_at`, seed data referensi (roles, jenis surat, jenis iuran) |
| 2 | `05b-rls-policies-SILAT-RT.sql` | Helper function role/scope + `ENABLE ROW LEVEL SECURITY` dan seluruh policy per role |
| 3 | `05c-auth-storage-realtime-SILAT-RT.sql` | Trigger auto-insert `public.users` saat registrasi, storage buckets, dan publikasi Realtime |

Jalankan sebagai satu transaksi berurutan di project Supabase yang sama.

---

## 2. RINGKASAN 27 TABEL (per domain)

| Domain | Tabel |
|---|---|
| Pengguna & Wilayah | `roles`, `wilayah_rt`, `users`, `langgar`, `pengurus_rt`, `pengurus_takmir` |
| Kependudukan | `kartu_keluarga`, `warga`, `riwayat_warga`, `qr_identitas` |
| Surat | `jenis_surat`, `tanda_tangan_digital`, `surat`, `qr_verifikasi_surat` |
| Keuangan | `jenis_iuran`, `transaksi_keuangan_rt`, `kategori_kas_takmir`, `transaksi_keuangan_takmir` |
| Takmir Operasional | `jadwal_imam`, `jadwal_sholat_cache`, `inventaris`, `surat_undangan`, `undangan_penerima`, `qr_verifikasi_undangan` |
| Agenda & Admin | `agenda`, `pengumuman`, `pengumuman_target`, `log_aktivitas`, `backup_database` |

Total **27 tabel**, konsisten dengan ERD Tahap 4.

---

## 3. STRATEGI RLS (ROW LEVEL SECURITY)

Prinsip yang dipakai di seluruh policy:

1. **Administrator** selalu bisa bypass lewat fungsi `is_admin()`.
2. **Scoping wilayah**: Pengurus RT hanya melihat/mengubah data dalam `wilayah_rt_id` miliknya sendiri (`current_wilayah_rt_id()`).
3. **Scoping langgar**: Pengurus Takmir hanya melihat/mengubah data langgar tempat ia terdaftar sebagai pengurus aktif (`current_langgar_ids()`).
4. **Data pribadi Warga**: Warga hanya bisa melihat data dirinya sendiri dan KK-nya (`current_warga_id()`), plus mengajukan surat atas namanya sendiri.
5. **Data publik terbatas**: Tabel `qr_verifikasi_surat`, `qr_verifikasi_undangan`, dan `jadwal_sholat_cache` sengaja dibuka untuk `select using (true)` — karena QR surat/undangan perlu bisa diverifikasi oleh siapa pun yang memindai (termasuk yang belum login), dan jadwal sholat bersifat informasi publik.
6. **Tabel referensi** (`roles`, `jenis_surat`, `jenis_iuran`, `kategori_kas_takmir`) — semua pengguna terautentikasi boleh baca, hanya admin yang boleh ubah struktur referensi.

---

## 4. SUPABASE AUTH

- Menggunakan **Supabase Auth (email/password)** bawaan — tidak perlu sistem auth kustom.
- Saat pengguna baru register di `auth.users`, trigger `on_auth_user_created` otomatis membuat baris pendamping di `public.users` dengan role default **Warga**.
- Admin kemudian dapat mengubah `role_id` pengguna tersebut (mis. menjadi Sekretaris RT) melalui modul Admin di aplikasi.
- Session menggunakan JWT bawaan Supabase — otomatis dibawa di setiap request dan dipakai fungsi `auth.uid()` dalam RLS.

---

## 5. SUPABASE STORAGE — DAFTAR BUCKET

| Bucket | Akses | Isi |
|---|---|---|
| `foto-warga` | Privat (authenticated) | Foto profil warga |
| `foto-langgar` | Publik | Foto profil langgar |
| `surat-pdf` | Privat + signed URL | File PDF surat yang sudah terbit |
| `ttd-stempel` | Privat (pemilik/admin) | File tanda tangan & stempel digital |
| `bukti-transaksi` | Privat | Nota/bukti pemasukan-pengeluaran |
| `backup-database` | Privat (admin only) | Hasil backup database |

Semua kuota berada dalam batas **Supabase Free Tier (1GB Storage)** — file PDF dan foto akan dikompresi di sisi frontend sebelum upload (diatur di Tahap 8/9).

---

## 6. SUPABASE REALTIME

Tabel yang dipublikasikan ke `supabase_realtime` (perubahan langsung tersinkron ke semua dashboard yang membuka data terkait):

- `transaksi_keuangan_rt` & `transaksi_keuangan_takmir` → saldo dashboard update otomatis
- `pengumuman` → notifikasi baru langsung muncul
- `agenda` → kalender kegiatan ter-update realtime
- `surat` → status pengajuan surat (diajukan → disetujui → terbit) terlihat langsung oleh pemohon
- `jadwal_imam` → perubahan jadwal langsung terlihat imam bersangkutan

---

## 7. STATUS TAHAP

✅ **Tahap 5 selesai**: 3 file SQL siap dieksekusi (schema, RLS policies, auth/storage/realtime) + ringkasan strategi keamanan dan realtime.

**File yang dihasilkan:**
- `05a-schema-SILAT-RT.sql`
- `05b-rls-policies-SILAT-RT.sql`
- `05c-auth-storage-realtime-SILAT-RT.sql`

Menunggu konfirmasi Anda sebelum lanjut ke **Tahap 6: UI/UX Lengkap Seluruh Halaman**.
