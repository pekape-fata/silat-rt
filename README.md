# SILAT RT (Sistem Informasi Langgar dan RT)

Aplikasi administrasi terpadu untuk Takmir Langgar/Musala (ibadah, kas,
jadwal imam, inventaris) dan RT (kependudukan, surat-menyurat, iuran,
agenda warga). Satu sistem, satu login, satu database — berbasis
Supabase (database + auth) dan Vercel (hosting), dapat diakses lewat
browser (PWA) maupun dibungkus jadi APK Android.

Untuk detail lengkap analisis kebutuhan, ERD, dan desain sistem, lihat
folder `docs/`.

## Menjalankan secara lokal

```
vercel dev
```

## Struktur migrasi database

Migrasi SQL di `supabase/migrations/` dijalankan berurutan sesuai
nomor filenya lewat Supabase SQL Editor. Migrasi 010 ke atas adalah
perbaikan keamanan (RLS) dan fitur tambahan yang dikerjakan setelah
rilis awal — lihat komentar di masing-masing file untuk detail apa
yang diperbaiki/ditambahkan.

## Fitur utama

- Manajemen data warga & kartu keluarga (RT)
- Alur surat pengantar/keterangan berjenjang: Sekretaris RT → Ketua RT
  → RW, termasuk pengajuan publik tanpa login
- Kas RT & Kas Takmir (pencatatan, laporan, grafik tren)
- Info & Pengumuman (pengumuman/surat edaran/himbauan)
- Undangan Takmir (buat undangan acara, cetak PDF berkop Langgar,
  kirim via WhatsApp)
- Jadwal Sholat Sepanjang Masa (halaman depan publik, dihitung dari
  koordinat langgar, tidak tergantung cache harian)
- Widget jam & jadwal sholat global di semua halaman
