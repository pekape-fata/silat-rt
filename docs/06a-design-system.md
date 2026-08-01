# TAHAP 6 — UI/UX LENGKAP SELURUH HALAMAN
## SILAT RT (Sistem Informasi Langgar dan RT)

## Bagian A — Design System

---

### A.1 Konsep Desain

SILAT RT menjembatani dua dunia: **administrasi sipil (RT)** dan **kehidupan langgar/musala**. Bahasa visualnya mengambil dari arsitektur langgar kampung — hijau tua yang teduh seperti halaman masjid, dipadu emas hangat seperti lampu petromaks/ornamen kaligrafi — tanpa jatuh ke ikonografi religius yang klise. Kesan akhir: **civic, tenang, terpercaya, tapi tetap hangat dan mudah dipakai orang tua.**

**Signature element**: *Ring Status* — indikator lingkaran/arc dua warna (hijau tua + emas) yang dipakai konsisten di banyak konteks berbeda: hitung mundur waktu sholat, progres status surat, dan visual saldo kas. Satu bentuk, banyak makna — elemen yang menyatukan dunia RT dan Takmir secara visual.

---

### A.2 Palet Warna (Design Tokens)

**Light Mode**
| Token | Hex | Fungsi |
|---|---|---|
| `--color-primary` | `#0F6B5C` | Hijau tua — aksi utama, top app bar, ring status |
| `--color-primary-container` | `#D3ECE4` | Latar chip/badge aktif, highlight kartu |
| `--color-secondary` | `#E8A33D` | Emas hangat — CTA sekunder, badge "perlu aksi", ring status (segmen 2) |
| `--color-secondary-container` | `#FBEBD1` | Latar badge peringatan ringan |
| `--color-surface` | `#F7F5F0` | Latar utama aplikasi (off-white hangat, bukan cream klise) |
| `--color-surface-card` | `#FFFFFF` | Latar kartu |
| `--color-border` | `#E4E0D6` | Garis tipis antar elemen |
| `--color-text-primary` | `#1B2B27` | Teks utama |
| `--color-text-muted` | `#5C6B66` | Teks sekunder/caption |
| `--color-success` | `#2E7D53` | Pemasukan, status disetujui |
| `--color-danger` | `#C0392B` | Pengeluaran, status ditolak, hapus |
| `--color-info` | `#2E6F9E` | Info netral |

**Dark Mode**
| Token | Hex | Fungsi |
|---|---|---|
| `--color-primary` | `#5FCBB0` | Hijau mint terang di atas latar gelap |
| `--color-primary-container` | `#0F2A24` | Latar chip aktif |
| `--color-secondary` | `#F0BE6C` | Emas terang |
| `--color-surface` | `#0F1A17` | Latar utama |
| `--color-surface-card` | `#17251F` | Latar kartu |
| `--color-border` | `#25352F` | Garis tipis |
| `--color-text-primary` | `#EAF3EF` | Teks utama |
| `--color-text-muted` | `#93A6A0` | Teks sekunder |

---

### A.3 Tipografi

| Peran | Font | Penggunaan |
|---|---|---|
| Display | **Sora** (600–700) | Judul halaman, angka besar di kartu statistik |
| Body | **Plus Jakarta Sans** (400–600) | Isi teks, label form, navigasi — terpilih karena keterbacaannya tinggi untuk konteks Indonesia dan tetap terasa hangat/humanis (bukan sans generik) |
| Data/Angka | **IBM Plex Mono** (500) | Nominal rupiah, nomor surat, NIK — agar angka sejajar rapi dan mudah dibaca lansia |

Skala tipe: `Display 28/34 · H1 22/28 · H2 18/24 · Body 15/22 · Caption 13/18 · Data 15/20 (mono)`
Ukuran badan teks minimum **15px** (bukan 14px) — pertimbangan aksesibilitas untuk pengguna lanjut usia.

---

### A.4 Bentuk, Elevasi & Material

- **Rounded corner**: kartu `16px`, tombol `12px`, chip/badge `999px` (pill), input `12px`.
- **Flat design** sebagai basis — bayangan (shadow) sangat tipis, dipakai hanya untuk membedakan lapisan (kartu di atas latar).
- **Glassmorphism ringan**: dipakai TERBATAS hanya pada 2 elemen mengambang — *bottom navigation bar* dan *modal/bottom sheet* (`backdrop-filter: blur(16px)`, latar semi-transparan `rgba(255,255,255,0.7)` / gelap `rgba(15,26,23,0.7)`). Tidak dipakai di kartu konten agar keterbacaan tetap tinggi bagi lansia.
- **Ikon**: garis (outline), stroke 1.5–2px, konsisten dengan Material Symbols.

---

### A.5 Komponen Kunci

- **Top App Bar**: judul halaman + badge role pengguna + toggle dark/light + avatar.
- **Bottom Navigation** (mobile): 5 slot — Beranda, Warga, Keuangan, Takmir, Lainnya — menu menyesuaikan otomatis per role (mis. Warga individual tidak melihat menu "Keuangan RT" tapi melihat "Surat Saya").
- **Kartu Statistik Dashboard**: angka besar (Display), label (Caption), tren kecil opsional.
- **Ring Status**: arc SVG dua warna, dipakai di jadwal sholat (progress ke waktu sholat berikut), status surat (progress 4 tahap), dan ringkasan saldo (proporsi pemasukan vs pengeluaran).
- **List Item Warga/Transaksi**: foto/avatar bulat, judul, subjudul, nominal/status di kanan (mono font untuk angka).
- **Form Stepper**: dipakai di alur "Buat Surat" — 3 langkah (Jenis Surat → Data Pemohon → Preview & Kirim).
- **Toast Notification**: pill di bawah layar, auto-dismiss 3 detik, warna sesuai status (success/danger/info).
- **Skeleton Loading**: blok abu-abu berdenyut lembut menggantikan kartu/list saat data dimuat.
- **Empty State**: ilustrasi garis sederhana + 1 kalimat arahan + tombol aksi (mis. "Belum ada transaksi bulan ini — catat transaksi pertama").

---

### A.6 Mode Terang/Gelap & Aksesibilitas

- Toggle tersedia di Top App Bar, tersimpan sesuai sesi pengguna.
- Kontras teks-latar dijaga minimal rasio 4.5:1 di kedua mode.
- Semua target sentuh (tombol/ikon) minimal `44x44px` — penting untuk pengguna lansia dengan presisi sentuh lebih rendah.
- Fokus keyboard terlihat jelas (outline 2px warna primary) untuk aksesibilitas non-mobile.
