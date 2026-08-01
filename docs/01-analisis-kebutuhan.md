# TAHAP 1 — ANALISIS KEBUTUHAN SISTEM
## SILAT RT (Sistem Informasi Langgar dan RT)

---

## 1. LATAR BELAKANG & TUJUAN

SILAT RT dibangun untuk menyatukan dua kebutuhan administrasi yang selama ini berjalan terpisah di tingkat lingkungan: **administrasi Takmir Langgar/Musala** (ibadah, kas, jadwal imam, inventaris) dan **administrasi RT** (kependudukan, surat-menyurat, iuran, agenda warga). Tujuannya: satu sistem, satu login, satu database, dapat diakses lewat browser (PWA) maupun APK Android, gratis dijalankan (Supabase free tier + Vercel free tier), dan cukup sederhana dipakai oleh pengurus non-teknis.

**Prinsip desain sistem:**
- Single source of truth: 1 wilayah (RT) bisa punya 1 atau lebih Langgar/Musala terkait.
- Role-based access control granular per modul.
- Semua data transaksi (kas, surat, warga) harus punya audit trail.
- WhatsApp hanya sebagai *jembatan pengiriman* (wa.me), bukan API berbayar — artinya sistem tidak pernah mengirim pesan otomatis tanpa review admin.

---

## 2. RUANG LINGKUP (SCOPE)

### 2.1 Termasuk dalam Sistem (In-Scope)
| Domain | Cakupan |
|---|---|
| Autentikasi & Hak Akses | 10 role, RLS per tabel, reset password oleh admin |
| Kependudukan | Data warga, KK, riwayat pindah/mutasi/meninggal, QR Code identitas |
| Surat-Menyurat RT | 15 jenis surat, nomor surat otomatis, TTD & stempel digital, verifikasi QR |
| Keuangan RT | 8 jenis iuran, pemasukan/pengeluaran, laporan bulanan/tahunan |
| Keuangan Takmir | Kas takmir terpisah dari kas RT, laporan terpisah |
| Takmir/Langgar | Profil, pengurus, jadwal imam berulang, jadwal sholat otomatis, inventaris |
| Surat Undangan Takmir | Template, kirim WA, QR verification |
| Agenda & Pengumuman | Agenda RT & Takmir, broadcast pengumuman bertarget |
| Laporan | Export PDF/Excel semua modul transaksional |
| Admin Tools | Backup/restore, import/export Excel, log aktivitas |
| Distribusi Aplikasi | PWA installable + APK Android (Android 8+) |

### 2.2 Di Luar Lingkup (Out-of-Scope) — Tahap Awal
- Pembayaran online (payment gateway) — iuran dicatat manual oleh bendahara, bukan e-payment.
- WhatsApp API resmi/berbayar (Meta Business API) — sengaja tidak dipakai sesuai requirement.
- Multi-RW/multi-kelurahan dalam satu instance (arsitektur akan disiapkan agar *bisa* diperluas ke sana di masa depan, tapi implementasi awal fokus 1 RT + langgar terkaitnya).
- Aplikasi iOS native (cukup PWA, karena target pengguna mayoritas Android).

---

## 3. AKTOR & ROLE PENGGUNA

| # | Role | Ringkasan Hak Akses Utama |
|---|---|---|
| 1 | Administrator | Akses penuh seluruh modul, kelola hak akses, backup/restore, log aktivitas |
| 2 | Ketua RT | Approve surat, lihat semua laporan RT, kelola pengumuman & agenda RT |
| 3 | Sekretaris RT | Input data warga, buat & proses surat, kelola agenda |
| 4 | Bendahara RT | Kelola kas/iuran RT, buat laporan keuangan RT |
| 5 | Ketua Takmir | Approve surat undangan takmir, lihat laporan takmir, kelola pengurus |
| 6 | Sekretaris Takmir | Kelola jadwal imam, agenda takmir, surat undangan |
| 7 | Bendahara Takmir | Kelola kas takmir, laporan keuangan takmir |
| 8 | Imam | Lihat jadwal pribadi, konfirmasi jadwal |
| 9 | Operator | Input data operasional (dibatasi per penugasan admin) |
| 10 | Warga | Lihat data pribadi & KK sendiri, lihat pengumuman/agenda, ajukan permohonan surat, lihat status iuran pribadi |

**Aturan akses:** setiap role hanya melihat menu & data sesuai hak aksesnya (RLS di level database, bukan hanya disembunyikan di UI — supaya aman walau API dipanggil langsung).

---

## 4. KEBUTUHAN FUNGSIONAL (FUNCTIONAL REQUIREMENTS)

Dikelompokkan per modul, format `FR-[Modul]-[No]`:

**FR-AUTH**
- FR-AUTH-01: Sistem menyediakan login berbasis email/password (Supabase Auth).
- FR-AUTH-02: Sistem membatasi menu sesuai role pengguna.
- FR-AUTH-03: Administrator dapat reset password pengguna lain.

**FR-WARGA**
- FR-WARGA-01: Sistem menyimpan data warga lengkap (NIK, KK, biodata, kontak, foto, QR Code).
- FR-WARGA-02: Sistem mencatat riwayat pindah, mutasi, dan meninggal tanpa menghapus data historis.
- FR-WARGA-03: Sistem dapat generate QR Code unik per warga untuk verifikasi identitas.

**FR-SURAT**
- FR-SURAT-01: Sistem menyediakan 15 template surat siap pakai dengan nomor surat otomatis (format dapat dikonfigurasi admin).
- FR-SURAT-02: Surat memuat tanda tangan digital Ketua RT & stempel digital.
- FR-SURAT-03: Setiap surat memiliki QR Code verifikasi keaslian yang dapat dipindai publik.
- FR-SURAT-04: Surat dapat diekspor ke PDF.

**FR-KEU-RT**
- FR-KEU-RT-01: Sistem mencatat pemasukan & pengeluaran per jenis iuran (8 jenis).
- FR-KEU-RT-02: Sistem menghitung saldo otomatis dan menyajikan grafik bulanan/tahunan.
- FR-KEU-RT-03: Laporan keuangan dapat difilter per tanggal dan diekspor PDF/Excel.

**FR-KEU-TAKMIR**
- FR-KEU-TAKMIR-01: Kas takmir dikelola terpisah dari kas RT namun dalam database yang sama.
- FR-KEU-TAKMIR-02: Fitur laporan sama seperti kas RT (grafik, filter, export).

**FR-TAKMIR**
- FR-TAKMIR-01: Sistem menyimpan profil langgar (nama, alamat, foto, peta lokasi, sejarah, visi-misi).
- FR-TAKMIR-02: Sistem menjadwalkan imam per waktu sholat dengan pola berulang otomatis.
- FR-TAKMIR-03: Sistem menampilkan jadwal sholat otomatis sepanjang tahun via API publik berbasis lokasi.
- FR-TAKMIR-04: Sistem mencatat inventaris langgar (nama barang, jumlah, kondisi).
- FR-TAKMIR-05: Sistem membuat surat undangan otomatis dengan pilihan penerima dan tombol kirim WhatsApp.

**FR-AGENDA-PENGUMUMAN**
- FR-AGENDA-01: Sistem mencatat agenda RT & Takmir dengan tanggal/waktu.
- FR-PENGUMUMAN-01: Pengumuman dapat ditargetkan ke grup penerima tertentu (semua warga/pengurus RT/pengurus takmir/jamaah tertentu) dan dikirim via notifikasi in-app + tombol WhatsApp (wa.me).

**FR-LAPORAN**
- FR-LAPORAN-01: Semua modul transaksional (kas RT, kas takmir, surat, warga) menyediakan preview, filter tanggal, cetak, export PDF & Excel.

**FR-ADMIN**
- FR-ADMIN-01: Admin dapat backup & restore database.
- FR-ADMIN-02: Admin dapat import/export data warga via Excel.
- FR-ADMIN-03: Sistem mencatat log aktivitas seluruh pengguna (siapa, kapan, aksi apa).

---

## 5. KEBUTUHAN NON-FUNGSIONAL (NON-FUNCTIONAL REQUIREMENTS)

| Kategori | Kebutuhan |
|---|---|
| **Usability** | UI Material Design 3, mobile-first, dapat dipakai oleh lansia (kontras tinggi, ukuran tombol besar, alur sederhana) |
| **Performance** | Lazy loading, pagination di semua tabel data besar (warga, transaksi), caching data referensi (jadwal sholat, master iuran) |
| **Availability** | Mode offline dasar (PWA service worker) untuk melihat data yang sudah pernah dimuat |
| **Security** | RLS Supabase per tabel, HTTPS wajib, validasi input di frontend & backend, proteksi XSS/CSRF, JWT session |
| **Scalability** | Skema database dirancang agar bisa menampung >1 langgar per RT dan siap diperluas ke multi-RT di masa depan |
| **Portability** | PWA installable + APK Android (Android 8+, via Trusted Web Activity/Capacitor) |
| **Maintainability** | Kode modular per fitur, penamaan konsisten, terdokumentasi, siap dikembangkan tim lanjutan |
| **Realtime** | Perubahan data kas, pengumuman, dan agenda tersinkron realtime antar pengguna (Supabase Realtime) |
| **Cost** | 100% berjalan di free tier: Supabase Free + Vercel Hobby + GitHub Free |

---

## 6. BATASAN & ASUMSI (CONSTRAINTS & ASSUMPTIONS)

**Batasan (Constraints):**
- Tidak menggunakan WhatsApp Business API berbayar — hanya `wa.me` link.
- Tidak ada anggaran hosting berbayar — semua desain harus tetap dalam kuota free tier (Supabase: 500MB DB, 1GB storage, 2GB bandwidth; Vercel: 100GB bandwidth/bulan).
- Jadwal sholat bergantung pada ketersediaan API publik gratis (mis. Aladhan API) — perlu fallback jika API down.

**Asumsi:**
- Satu instance sistem melayani satu wilayah RT beserta 1 atau lebih langgar yang berasosiasi dengannya.
- Pengurus RT dan Takmir bisa jadi orang yang sama (role dapat digabung pada satu akun bila diperlukan admin).
- Warga memiliki akses smartphone Android minimal versi 8, atau diwakilkan oleh pengurus untuk input data.

---

## 7. DAFTAR ISTILAH (GLOSSARY)

| Istilah | Definisi |
|---|---|
| Langgar/Musala | Tempat ibadah kecil tingkat RT/lingkungan |
| Takmir | Pengurus yang mengelola kegiatan dan operasional langgar |
| Jimpitan | Iuran sukarela warga (beras/uang) yang dikumpulkan berkala |
| RLS | Row Level Security — kontrol akses data di level baris database |
| PWA | Progressive Web App — aplikasi web yang bisa di-install seperti aplikasi native |

---

## 8. STATUS TAHAP

✅ **Tahap 1 selesai**: Analisis kebutuhan sistem (fungsional, non-fungsional, aktor, scope, batasan).

Menunggu konfirmasi Anda sebelum lanjut ke **Tahap 2: Flowchart** — atau beri tahu jika ada kebutuhan yang perlu direvisi/ditambahkan di tahap ini terlebih dahulu.
