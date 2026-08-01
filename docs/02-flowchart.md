# TAHAP 2 — FLOWCHART SISTEM
## SILAT RT (Sistem Informasi Langgar dan RT)

---

## 1. FLOWCHART UMUM SISTEM (HIGH-LEVEL)

```mermaid
flowchart TD
    A[Pengguna Buka Aplikasi] --> B{Sudah Login?}
    B -- Tidak --> C[Halaman Login]
    C --> D[Input Email & Password]
    D --> E{Autentikasi Supabase}
    E -- Gagal --> C
    E -- Berhasil --> F[Cek Role Pengguna]
    B -- Ya --> F
    F --> G[Tampilkan Dashboard Sesuai Role]
    G --> H{Pilih Modul}
    H --> I[Modul Warga]
    H --> J[Modul Surat]
    H --> K[Modul Keuangan RT]
    H --> L[Modul Keuangan Takmir]
    H --> M[Modul Takmir/Langgar]
    H --> N[Modul Agenda & Pengumuman]
    H --> O[Modul Laporan]
    H --> P[Modul Admin]
    I --> Q[Simpan/Update Data]
    J --> Q
    K --> Q
    L --> Q
    M --> Q
    N --> Q
    O --> R[Generate Laporan PDF/Excel]
    P --> S[Kelola Sistem]
    Q --> T[(Supabase Database)]
    T --> U[Realtime Sync ke Semua Sesi Aktif]
```

---

## 2. FLOWCHART LOGIN & OTORISASI ROLE

```mermaid
flowchart TD
    A[Buka Aplikasi] --> B[Form Login]
    B --> C[Submit Email/Password]
    C --> D{Supabase Auth Valid?}
    D -- Tidak --> E[Tampilkan Pesan Error]
    E --> B
    D -- Ya --> F[Ambil Data Role dari Tabel users]
    F --> G{Role?}
    G -- Administrator --> H[Full Menu Access]
    G -- Ketua/Sekretaris/Bendahara RT --> I[Menu RT Sesuai Jabatan]
    G -- Ketua/Sekretaris/Bendahara Takmir --> J[Menu Takmir Sesuai Jabatan]
    G -- Imam --> K[Menu Jadwal Pribadi]
    G -- Operator --> L[Menu Terbatas Sesuai Penugasan]
    G -- Warga --> M[Menu Warga: Data Pribadi, Surat, Info]
    H --> N[Dashboard]
    I --> N
    J --> N
    K --> N
    L --> N
    M --> N
```

---

## 3. FLOWCHART PENGAJUAN & PENERBITAN SURAT

```mermaid
flowchart TD
    A[Warga/Sekretaris Buka Modul Surat] --> B[Pilih Jenis Surat]
    B --> C[Isi Form Data Pemohon]
    C --> D[Sistem Ambil Data Warga dari Database]
    D --> E[Preview Surat dengan Template]
    E --> F{Perlu Approval Ketua RT?}
    F -- Ya --> G[Kirim ke Ketua RT untuk Approve]
    G --> H{Disetujui?}
    H -- Tidak --> I[Kembalikan dengan Catatan Revisi]
    I --> C
    H -- Ya --> J[Generate Nomor Surat Otomatis]
    F -- Tidak, Auto-Approve --> J
    J --> K[Tempel Tanda Tangan Digital & Stempel]
    K --> L[Generate QR Code Verifikasi]
    L --> M[Export ke PDF]
    M --> N[Simpan ke Storage & Log Aktivitas]
    N --> O[Surat Siap Diunduh/Dicetak]
```

---

## 4. FLOWCHART TRANSAKSI KEUANGAN (RT & TAKMIR)

```mermaid
flowchart TD
    A[Bendahara Buka Modul Keuangan] --> B{Pilih Jenis Kas}
    B -- Kas RT --> C[Pilih Jenis Iuran: Kas/Sampah/Keamanan/Jimpitan/Arisan/Pembangunan/Air/Lainnya]
    B -- Kas Takmir --> D[Kategori Kas Takmir]
    C --> E[Input Transaksi: Pemasukan/Pengeluaran]
    D --> E
    E --> F[Sistem Hitung Ulang Saldo Otomatis]
    F --> G[(Simpan ke Database)]
    G --> H[Realtime Update ke Dashboard Semua Pengguna Terkait]
    H --> I{Butuh Laporan?}
    I -- Ya --> J[Filter Tanggal/Bulan/Tahun]
    J --> K[Generate Grafik & Tabel]
    K --> L[Export PDF/Excel atau Cetak]
    I -- Tidak --> M[Selesai]
```

---

## 5. FLOWCHART JADWAL IMAM & JADWAL SHOLAT OTOMATIS

```mermaid
flowchart TD
    A[Sekretaris Takmir Buka Modul Jadwal] --> B{Jenis Jadwal?}
    B -- Jadwal Imam --> C[Input Pola Rotasi Imam per Waktu Sholat]
    C --> D[Sistem Generate Jadwal Berulang Otomatis]
    D --> E[(Simpan ke Database)]
    B -- Jadwal Sholat --> F[Sistem Ambil Lokasi Langgar]
    F --> G[Panggil API Jadwal Sholat Gratis]
    G --> H{API Berhasil Merespons?}
    H -- Tidak --> I[Gunakan Cache Jadwal Terakhir]
    H -- Ya --> J[Simpan/Update Cache Lokal]
    I --> K[Tampilkan Jadwal Sholat di Dashboard]
    J --> K
    E --> L[Tampilkan Jadwal Imam di Dashboard & Notifikasi Imam Bersangkutan]
```

---

## 6. FLOWCHART PENGUMUMAN & SURAT UNDANGAN (VIA WHATSAPP)

```mermaid
flowchart TD
    A[Pengurus Buat Pengumuman/Undangan] --> B[Pilih Target Penerima: Semua Warga/Pengurus RT/Pengurus Takmir/Jamaah Tertentu]
    B --> C[Sistem Ambil Daftar Nomor WA dari Database]
    C --> D[Generate Teks Pesan dari Template]
    D --> E[Tampilkan Preview Pesan]
    E --> F[Klik Tombol Kirim WhatsApp]
    F --> G[Buka Link wa.me dengan Pesan Terisi]
    G --> H[Admin Review & Kirim Manual di WhatsApp]
    D --> I[Kirim Notifikasi In-App ke Warga Terkait]
    I --> J[Realtime Muncul di Dashboard Warga]
```

---

## 7. FLOWCHART ADMIN: BACKUP, RESTORE, IMPORT/EXPORT

```mermaid
flowchart TD
    A[Admin Buka Modul Admin] --> B{Pilih Aksi}
    B -- Backup --> C[Sistem Export Snapshot Database]
    C --> D[Simpan ke Supabase Storage]
    B -- Restore --> E[Admin Upload File Backup]
    E --> F{Validasi Format Valid?}
    F -- Tidak --> G[Tampilkan Error]
    F -- Ya --> H[Restore Data ke Database]
    B -- Import Excel --> I[Admin Upload File Excel Data Warga]
    I --> J{Validasi Kolom & Format}
    J -- Tidak --> G
    J -- Ya --> K[Insert/Update Massal ke Database]
    B -- Export Excel --> L[Sistem Generate File Excel dari Data Terpilih]
    D --> M[Log Aktivitas Tercatat]
    H --> M
    K --> M
    L --> M
```

---

## 8. STATUS TAHAP

✅ **Tahap 2 selesai**: Flowchart sistem — alur umum, login & role, penerbitan surat, transaksi keuangan, jadwal imam/sholat, pengumuman via WhatsApp, dan admin (backup/restore/import/export).

Menunggu konfirmasi Anda sebelum lanjut ke **Tahap 3: Use Case Diagram**.
