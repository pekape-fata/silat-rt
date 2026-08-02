# Paket Fitur: Info & Pengumuman (Pengumuman / Surat Edaran / Himbauan)

Prioritas #1 dari 3 fitur yang direncanakan (Pengumuman, Jadwal Sholat,
Undangan) — dipilih lebih dulu karena skema database & RLS-nya sudah
lengkap sejak awal, jadi paling cepat memberi manfaat dengan effort
paling kecil.

## Isi paket

```
src/pages/pengumuman/
  pengumuman.html
  pengumuman.js
PATCH_router_dan_rbac.txt   <- WAJIB diterapkan agar halaman terhubung
README.md
```

## Cara menerapkan

1. Salin folder `src/pages/pengumuman/` ke lokasi yang sama di repo.
2. Ikuti `PATCH_router_dan_rbac.txt` untuk menghubungkan rute ke
   `src/router.js` dan `src/lib/rbac.js`.
3. Tidak perlu migrasi SQL baru — tabel `pengumuman` sudah ada.
4. Login sebagai role yang punya akses `write` pengumuman (Ketua RT,
   Sekretaris RT, PKK RT, Ketua/Sekretaris/Bendahara RW, Ketua/
   Sekretaris/Bendahara Takmir, atau Administrator) untuk melihat
   tombol "+".

## Cara kerja

Satu tabel `pengumuman` dipakai untuk 3 kebutuhan sekaligus
(Pengumuman/Surat Edaran/Himbauan) — dibedakan lewat pilihan "Jenis"
di form, yang disematkan sebagai prefix pada judul (mis. "[Surat
Edaran] Jadwal Kerja Bakti"). Kalau nanti perlu filter per jenis di
level database (bukan cuma tampilan), tinggal tambah kolom
`jenis varchar(20)` lewat migrasi kecil — tidak perlu ubah struktur
besar.

Warga & semua pengurus (siapa pun yang login) bisa membaca pengumuman
sesuai RLS `pengumuman_select_authenticated`. Yang boleh menulis
diatur oleh `CAPABILITIES.pengumuman` di `rbac.js` (tampilan) yang
mencerminkan `pengumuman_write_pengurus` di RLS (penegakan sebenarnya).

## Langkah berikutnya

Sesuai urutan prioritas sebelumnya:
2. **Jadwal Sholat Sepanjang Masa** (tabel `jadwal_sholat_cache` sudah
   ada, tinggal UI + fetch dari Aladhan API kalau data kosong)
3. **Undangan Takmir** (paling kompleks — akan pakai kop Langgar Al
   Muchtarom yang sudah disiapkan sebelumnya)

Beri tahu saya kapan mau lanjut ke fitur berikutnya.
