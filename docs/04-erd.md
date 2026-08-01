# TAHAP 4 — ERD (ENTITY RELATIONSHIP DIAGRAM)
## SILAT RT (Sistem Informasi Langgar dan RT)

Skema dirancang normal minimal 3NF, siap diimplementasikan sebagai PostgreSQL/Supabase pada Tahap 5.

---

## 1. ERD — DOMAIN INTI: PENGGUNA, WILAYAH, LANGGAR

```mermaid
erDiagram
    ROLES ||--o{ USERS : "memiliki"
    WILAYAH_RT ||--o{ USERS : "berada di"
    WILAYAH_RT ||--o{ LANGGAR : "menaungi"
    LANGGAR ||--o{ PENGURUS_TAKMIR : "memiliki"
    USERS ||--o| PENGURUS_TAKMIR : "menjabat sebagai"
    USERS ||--o| PENGURUS_RT : "menjabat sebagai"
    WILAYAH_RT ||--o{ PENGURUS_RT : "memiliki"

    ROLES {
        uuid id PK
        varchar nama_role
        text deskripsi
    }
    USERS {
        uuid id PK
        uuid role_id FK
        uuid wilayah_rt_id FK
        varchar email
        varchar nama_lengkap
        varchar no_wa
        varchar foto_url
        boolean aktif
        timestamptz created_at
    }
    WILAYAH_RT {
        uuid id PK
        varchar nama_rt
        varchar nama_rw
        varchar kelurahan
        varchar kecamatan
        varchar kota
        varchar provinsi
    }
    LANGGAR {
        uuid id PK
        uuid wilayah_rt_id FK
        varchar nama_langgar
        text alamat
        decimal latitude
        decimal longitude
        varchar foto_url
        text sejarah
        text visi
        text misi
    }
    PENGURUS_RT {
        uuid id PK
        uuid wilayah_rt_id FK
        uuid user_id FK
        varchar jabatan
        date tanggal_mulai
        date tanggal_selesai
    }
    PENGURUS_TAKMIR {
        uuid id PK
        uuid langgar_id FK
        uuid user_id FK
        varchar jabatan
        varchar no_wa
        text alamat
        date tanggal_mulai
        date tanggal_selesai
    }
```

---

## 2. ERD — DOMAIN KEPENDUDUKAN

```mermaid
erDiagram
    WILAYAH_RT ||--o{ KARTU_KELUARGA : "memiliki"
    KARTU_KELUARGA ||--o{ WARGA : "beranggotakan"
    WARGA ||--o{ RIWAYAT_WARGA : "memiliki"
    WARGA ||--o| QR_IDENTITAS : "memiliki"

    KARTU_KELUARGA {
        uuid id PK
        uuid wilayah_rt_id FK
        varchar no_kk
        text alamat
        uuid kepala_keluarga_id FK
        timestamptz created_at
    }
    WARGA {
        uuid id PK
        uuid kk_id FK
        varchar nik
        varchar nama
        varchar tempat_lahir
        date tanggal_lahir
        varchar agama
        varchar pendidikan
        varchar pekerjaan
        varchar golongan_darah
        varchar status_kawin
        varchar no_hp
        varchar no_wa
        varchar email
        text alamat
        varchar foto_url
        varchar status_domisili "aktif/pindah/meninggal"
        timestamptz created_at
    }
    RIWAYAT_WARGA {
        uuid id PK
        uuid warga_id FK
        varchar jenis_riwayat "pindah/mutasi/meninggal"
        text keterangan
        date tanggal_kejadian
        uuid dicatat_oleh FK
        timestamptz created_at
    }
    QR_IDENTITAS {
        uuid id PK
        uuid warga_id FK
        varchar kode_qr
        timestamptz generated_at
    }
```

---

## 3. ERD — DOMAIN SURAT-MENYURAT

```mermaid
erDiagram
    WARGA ||--o{ SURAT : "mengajukan"
    JENIS_SURAT ||--o{ SURAT : "berdasarkan"
    SURAT ||--o| QR_VERIFIKASI_SURAT : "memiliki"
    SURAT ||--o| TANDA_TANGAN_DIGITAL : "ditandatangani"
    USERS ||--o{ SURAT : "menyetujui/memproses"

    JENIS_SURAT {
        uuid id PK
        varchar nama_jenis "KTP/KK/SKCK/Nikah/dll"
        varchar format_nomor
        text template_konten
        boolean butuh_approval
    }
    SURAT {
        uuid id PK
        uuid jenis_surat_id FK
        uuid warga_id FK
        varchar nomor_surat
        text isi_surat
        varchar status "diajukan/diproses/disetujui/ditolak/terbit"
        uuid diproses_oleh FK
        uuid disetujui_oleh FK
        text catatan_revisi
        varchar file_pdf_url
        timestamptz created_at
        timestamptz terbit_at
    }
    TANDA_TANGAN_DIGITAL {
        uuid id PK
        uuid user_id FK
        varchar jabatan
        varchar file_ttd_url
        varchar file_stempel_url
    }
    QR_VERIFIKASI_SURAT {
        uuid id PK
        uuid surat_id FK
        varchar kode_qr
        varchar url_verifikasi
        timestamptz generated_at
    }
```

---

## 4. ERD — DOMAIN KEUANGAN (RT & TAKMIR)

```mermaid
erDiagram
    JENIS_IURAN ||--o{ TRANSAKSI_KEUANGAN_RT : "berdasarkan"
    WILAYAH_RT ||--o{ TRANSAKSI_KEUANGAN_RT : "memiliki"
    KARTU_KELUARGA ||--o{ TRANSAKSI_KEUANGAN_RT : "membayar"
    LANGGAR ||--o{ TRANSAKSI_KEUANGAN_TAKMIR : "memiliki"
    KATEGORI_KAS_TAKMIR ||--o{ TRANSAKSI_KEUANGAN_TAKMIR : "berdasarkan"
    USERS ||--o{ TRANSAKSI_KEUANGAN_RT : "mencatat"
    USERS ||--o{ TRANSAKSI_KEUANGAN_TAKMIR : "mencatat"

    JENIS_IURAN {
        uuid id PK
        varchar nama_iuran "Kas/Sampah/Keamanan/Jimpitan/Arisan/Pembangunan/Air/Lainnya"
        decimal nominal_default
        varchar periode "bulanan/insidental"
    }
    TRANSAKSI_KEUANGAN_RT {
        uuid id PK
        uuid wilayah_rt_id FK
        uuid jenis_iuran_id FK
        uuid kk_id FK "nullable, untuk pemasukan iuran"
        varchar tipe "pemasukan/pengeluaran"
        decimal nominal
        text keterangan
        date tanggal_transaksi
        uuid dicatat_oleh FK
        varchar bukti_url
        timestamptz created_at
    }
    KATEGORI_KAS_TAKMIR {
        uuid id PK
        varchar nama_kategori
    }
    TRANSAKSI_KEUANGAN_TAKMIR {
        uuid id PK
        uuid langgar_id FK
        uuid kategori_id FK
        varchar tipe "pemasukan/pengeluaran"
        decimal nominal
        text keterangan
        date tanggal_transaksi
        uuid dicatat_oleh FK
        varchar bukti_url
        timestamptz created_at
    }
```

---

## 5. ERD — DOMAIN TAKMIR OPERASIONAL (JADWAL, INVENTARIS, UNDANGAN)

```mermaid
erDiagram
    LANGGAR ||--o{ JADWAL_IMAM : "memiliki"
    PENGURUS_TAKMIR ||--o{ JADWAL_IMAM : "bertugas"
    LANGGAR ||--o{ INVENTARIS : "memiliki"
    LANGGAR ||--o{ JADWAL_SHOLAT_CACHE : "memiliki"
    LANGGAR ||--o{ SURAT_UNDANGAN : "menerbitkan"
    SURAT_UNDANGAN ||--o{ UNDANGAN_PENERIMA : "ditujukan ke"
    SURAT_UNDANGAN ||--o| QR_VERIFIKASI_UNDANGAN : "memiliki"

    JADWAL_IMAM {
        uuid id PK
        uuid langgar_id FK
        uuid pengurus_takmir_id FK
        varchar waktu_sholat "subuh/dzuhur/ashar/maghrib/isya"
        varchar pola_ulang "harian/mingguan/custom"
        date tanggal_mulai
        date tanggal_selesai
    }
    JADWAL_SHOLAT_CACHE {
        uuid id PK
        uuid langgar_id FK
        date tanggal
        time subuh
        time dzuhur
        time ashar
        time maghrib
        time isya
        varchar sumber_data
        timestamptz cached_at
    }
    INVENTARIS {
        uuid id PK
        uuid langgar_id FK
        varchar nama_barang
        int jumlah
        varchar kondisi "baik/rusak/perlu perbaikan"
        text keterangan
    }
    SURAT_UNDANGAN {
        uuid id PK
        uuid langgar_id FK
        varchar judul_acara
        text isi_undangan
        date tanggal_acara
        uuid dibuat_oleh FK
        varchar status "draft/terkirim"
        timestamptz created_at
    }
    UNDANGAN_PENERIMA {
        uuid id PK
        uuid undangan_id FK
        uuid warga_id FK
        varchar status_kirim "belum/terkirim"
    }
    QR_VERIFIKASI_UNDANGAN {
        uuid id PK
        uuid undangan_id FK
        varchar kode_qr
    }
```

---

## 6. ERD — DOMAIN AGENDA, PENGUMUMAN, ADMIN & LOG

```mermaid
erDiagram
    WILAYAH_RT ||--o{ AGENDA : "memiliki"
    LANGGAR ||--o{ AGENDA : "memiliki"
    USERS ||--o{ PENGUMUMAN : "membuat"
    PENGUMUMAN ||--o{ PENGUMUMAN_TARGET : "ditujukan ke"
    USERS ||--o{ LOG_AKTIVITAS : "melakukan"
    USERS ||--o{ BACKUP_DATABASE : "melakukan"

    AGENDA {
        uuid id PK
        uuid wilayah_rt_id FK "nullable"
        uuid langgar_id FK "nullable"
        varchar judul
        text deskripsi
        date tanggal_mulai
        date tanggal_selesai
        varchar lokasi
        uuid dibuat_oleh FK
    }
    PENGUMUMAN {
        uuid id PK
        varchar judul
        text isi
        varchar target_grup "semua_warga/pengurus_rt/pengurus_takmir/jamaah_tertentu"
        uuid dibuat_oleh FK
        timestamptz created_at
    }
    PENGUMUMAN_TARGET {
        uuid id PK
        uuid pengumuman_id FK
        uuid user_id FK "nullable jika target grup"
    }
    LOG_AKTIVITAS {
        uuid id PK
        uuid user_id FK
        varchar aksi
        varchar modul
        text detail
        varchar ip_address
        timestamptz created_at
    }
    BACKUP_DATABASE {
        uuid id PK
        uuid dilakukan_oleh FK
        varchar jenis "backup/restore"
        varchar file_url
        varchar status
        timestamptz created_at
    }
```

---

## 7. CATATAN NORMALISASI (3NF)

- Setiap tabel memiliki primary key `uuid` (menghindari collision saat sinkronisasi offline/realtime).
- Data historis (`RIWAYAT_WARGA`) dipisah dari tabel master `WARGA` agar tidak mengubah/menghapus data lama — mendukung audit trail.
- `TRANSAKSI_KEUANGAN_RT` dan `TRANSAKSI_KEUANGAN_TAKMIR` dipisah sesuai requirement (kas RT ≠ kas takmir), namun berbagi pola struktur yang sama untuk memudahkan query laporan gabungan bila diperlukan admin.
- `JENIS_SURAT`, `JENIS_IURAN`, `KATEGORI_KAS_TAKMIR` dijadikan tabel referensi terpisah (bukan enum tetap) sehingga admin dapat menambah jenis baru tanpa mengubah skema.
- `JADWAL_SHOLAT_CACHE` memisahkan data dari API eksternal agar sistem tetap berjalan (fallback) saat API down — bukan dependensi langsung tiap request.
- Tidak ada atribut multi-nilai dalam satu kolom (mis. daftar penerima undangan dipecah ke `UNDANGAN_PENERIMA`, bukan disimpan sebagai array di satu baris) — memenuhi 1NF/2NF/3NF sekaligus.

---

## 8. RENCANA INDEX & CONSTRAINT (akan diimplementasikan penuh di Tahap 5)

| Tabel | Index/Constraint Utama |
|---|---|
| WARGA | UNIQUE(nik), INDEX(kk_id), INDEX(status_domisili) |
| SURAT | INDEX(warga_id), INDEX(status), UNIQUE(nomor_surat) |
| TRANSAKSI_KEUANGAN_RT | INDEX(wilayah_rt_id, tanggal_transaksi), INDEX(jenis_iuran_id) |
| TRANSAKSI_KEUANGAN_TAKMIR | INDEX(langgar_id, tanggal_transaksi) |
| JADWAL_SHOLAT_CACHE | UNIQUE(langgar_id, tanggal) |
| LOG_AKTIVITAS | INDEX(user_id, created_at) |
| USERS | UNIQUE(email) |

Foreign key seluruh tabel menggunakan `ON DELETE RESTRICT` untuk data transaksi/legal (surat, keuangan, riwayat) dan `ON DELETE CASCADE` untuk data anak yang murni dependen (mis. `PENGUMUMAN_TARGET`, `UNDANGAN_PENERIMA`).

---

## 9. STATUS TAHAP

✅ **Tahap 4 selesai**: ERD lengkap 6 domain (Pengguna/Wilayah/Langgar, Kependudukan, Surat, Keuangan, Takmir Operasional, Agenda/Pengumuman/Admin), catatan normalisasi 3NF, serta rencana index & constraint.

Menunggu konfirmasi Anda sebelum lanjut ke **Tahap 5: Struktur Database Supabase (SQL Schema + RLS)**.
