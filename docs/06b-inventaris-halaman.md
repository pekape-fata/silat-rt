# TAHAP 6 — UI/UX LENGKAP SELURUH HALAMAN
## Bagian B — Inventaris Halaman (Site Map)

Total **42 halaman** dikelompokkan per modul. Kolom "Role Akses" mengikuti RLS Tahap 5.

### B.1 Autentikasi & Umum (4 halaman)
| # | Halaman | Role Akses |
|---|---|---|
| 1 | Login | Semua |
| 2 | Lupa Password | Semua |
| 3 | Splash/Onboarding PWA Install | Semua |
| 4 | Profil Saya & Pengaturan (tema, notifikasi) | Semua |

### B.2 Dashboard (2 halaman — beda layout per kelompok role)
| # | Halaman | Role Akses |
|---|---|---|
| 5 | Dashboard Pengurus (RT/Takmir/Admin) — statistik lengkap | Admin, Ketua/Sekretaris/Bendahara RT & Takmir |
| 6 | Dashboard Warga — ringkasan pribadi, pengumuman, jadwal sholat | Warga, Imam, Operator |

### B.3 Modul Kependudukan (7 halaman)
| # | Halaman | Role Akses |
|---|---|---|
| 7 | Daftar Warga (list + search + filter) | Admin, Ketua/Sekretaris RT |
| 8 | Detail Warga | Admin, Ketua/Sekretaris RT, Warga (diri sendiri) |
| 9 | Tambah/Edit Warga | Admin, Sekretaris RT |
| 10 | Daftar Kartu Keluarga | Admin, Ketua/Sekretaris RT |
| 11 | Detail Kartu Keluarga & Anggota | Admin, Ketua/Sekretaris RT, Warga (KK sendiri) |
| 12 | Riwayat Pindah/Mutasi/Meninggal | Admin, Sekretaris RT |
| 13 | Kartu Identitas QR Warga | Semua (milik sendiri), Admin/Sekretaris (semua) |

### B.4 Modul Surat (6 halaman)
| # | Halaman | Role Akses |
|---|---|---|
| 14 | Daftar Jenis Surat | Semua |
| 15 | Ajukan Surat (form stepper) | Warga, Sekretaris RT (atas nama warga) |
| 16 | Daftar Pengajuan Surat (antrian approval) | Ketua/Sekretaris RT |
| 17 | Detail & Approval Surat | Ketua RT |
| 18 | Preview & Cetak Surat (PDF + QR + TTD) | Ketua/Sekretaris RT, pemohon |
| 19 | Verifikasi Surat via QR (halaman publik) | Publik (tanpa login) |

### B.5 Modul Keuangan RT (5 halaman)
| # | Halaman | Role Akses |
|---|---|---|
| 20 | Ringkasan Kas RT (saldo + grafik) | Bendahara/Ketua RT, Admin |
| 21 | Daftar Transaksi Kas RT | Bendahara/Ketua RT, Admin |
| 22 | Tambah Transaksi Kas RT | Bendahara RT |
| 23 | Kelola Jenis Iuran | Bendahara RT, Admin |
| 24 | Laporan Keuangan RT (filter + export) | Bendahara/Ketua RT, Admin |

### B.6 Modul Keuangan Takmir (4 halaman)
| # | Halaman | Role Akses |
|---|---|---|
| 25 | Ringkasan Kas Takmir | Bendahara/Ketua Takmir, Admin |
| 26 | Daftar & Tambah Transaksi Kas Takmir | Bendahara Takmir |
| 27 | Kelola Kategori Kas Takmir | Bendahara Takmir, Admin |
| 28 | Laporan Keuangan Takmir (filter + export) | Bendahara/Ketua Takmir, Admin |

### B.7 Modul Takmir/Langgar (8 halaman)
| # | Halaman | Role Akses |
|---|---|---|
| 29 | Profil Langgar (peta, sejarah, visi-misi) | Semua |
| 30 | Daftar Pengurus Takmir | Semua |
| 31 | Jadwal Imam (kalender rotasi) | Semua (lihat), Sekretaris Takmir (kelola) |
| 32 | Jadwal Sholat Otomatis | Semua |
| 33 | Inventaris Langgar | Semua (lihat), Sekretaris/Ketua Takmir (kelola) |
| 34 | Daftar Surat Undangan | Pengurus Takmir |
| 35 | Buat Surat Undangan (pilih penerima + kirim WA) | Sekretaris/Ketua Takmir |
| 36 | Verifikasi Undangan via QR (halaman publik) | Publik |

### B.8 Modul Agenda & Pengumuman (3 halaman)
| # | Halaman | Role Akses |
|---|---|---|
| 37 | Kalender Agenda (RT & Takmir gabungan) | Semua |
| 38 | Buat/Edit Agenda | Pengurus RT & Takmir |
| 39 | Daftar & Buat Pengumuman (target grup) | Pengurus RT & Takmir |

### B.9 Modul Admin (3 halaman)
| # | Halaman | Role Akses |
|---|---|---|
| 40 | Kelola Pengguna & Hak Akses | Admin |
| 41 | Backup/Restore & Import-Export Excel | Admin |
| 42 | Log Aktivitas Sistem | Admin |

---

### B.10 Navigasi Adaptif per Role (contoh Bottom Navigation)

| Role | Slot 1 | Slot 2 | Slot 3 | Slot 4 | Slot 5 |
|---|---|---|---|---|---|
| Ketua/Sekretaris/Bendahara RT | Beranda | Warga | Surat | Keuangan | Lainnya |
| Ketua/Sekretaris/Bendahara Takmir | Beranda | Langgar | Jadwal | Kas Takmir | Lainnya |
| Warga | Beranda | Surat Saya | Agenda | Pengumuman | Profil |
| Administrator | Beranda | Pengguna | Data | Laporan | Sistem |

---

Selanjutnya, Bagian C berisi **mockup visual interaktif** (HTML) yang menerapkan design system di atas pada 7 halaman representatif yang mencakup semua pola UI utama (form, list, dashboard, detail, publik).
