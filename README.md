# Paket: Notifikasi Surat Menunggu Tindakan (Dashboard)

## Kenapa ini dibutuhkan

Surat yang Anda ajukan lewat halaman publik **sudah tersimpan dengan
benar** (ID `11f86f49`, status `menunggu_verifikasi`) — bug RLS
sebelumnya sudah beres. Yang hilang murni fitur: `antrian-surat.js`
hanya memuat data sekali saat halaman dibuka, tidak ada indikator apa
pun di dashboard/menu lain yang memberi tahu Sekretaris RT bahwa ada
pengajuan baru menunggu.

## Isi paket

```
PATCH_dashboard_notifikasi_surat.txt   <- WAJIB
README.md
```

## Cara menerapkan

Ikuti `PATCH_dashboard_notifikasi_surat.txt` (2 bagian: HTML + JS).
Tidak perlu migrasi SQL apa pun.

## Cara kerja

Kartu baru muncul di paling atas dashboard (di bawah salam,
sebelum grafik keuangan), khusus untuk role yang punya tahap aktif
menunggu tindakan:

| Role | Dipicu oleh status | Tujuan link |
|------|---------------------|-------------|
| Sekretaris RT | `menunggu_verifikasi` | Antrian Surat |
| Ketua RT | `terverifikasi_sekretaris_rt` | Preview Surat |
| Ketua RW / Sekretaris RW | `ditandatangani_rt` | Approval Surat |

Kartu otomatis tersembunyi kalau tidak ada surat pending di tahap
peran tersebut.

## Batasan (silakan beri tahu kalau perlu ditingkatkan)

Ini notifikasi "tarik" (pull) — akurat begitu dashboard dibuka, tapi
BUKAN notifikasi push (tidak akan muncul pop-up/WA otomatis kalau
Sekretaris RT sedang tidak membuka aplikasi). Kalau butuh notifikasi
yang benar-benar real-time/push, itu perlu pendekatan tambahan
(Supabase Realtime subscription untuk badge langsung update tanpa
refresh, atau Edge Function + WhatsApp API untuk kirim pesan otomatis
saat ada surat baru) — beri tahu saya kalau ini yang dibutuhkan
berikutnya.
