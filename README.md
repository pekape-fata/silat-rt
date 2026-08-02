# Paket Update Kop Surat — SILAT RT

## Isi paket

```
public/assets/kop/
  kop-rt-001-rw-009.png     <- dari file yang Anda kirim
  kop-al-muchtarom.png      <- dari file yang Anda kirim
src/lib/pdf.js               <- pengganti file lama, siap timpa langsung
PATCH_preview-surat.js.txt   <- perubahan kecil yang WAJIB ikut diterapkan
CONTOH_TEMPLATE_SURAT.md     <- 2 contoh templat isi surat untuk didiskusikan
README.md                    <- file ini
```

## Cara menerapkan

1. **Salin folder `public/assets/kop/`** ke lokasi yang sama di repo Anda
   (folder `assets/` belum ada di `public/` sebelumnya, jadi ini folder baru).
2. **Timpa `src/lib/pdf.js`** dengan file di paket ini.
3. **Terapkan `PATCH_preview-surat.js.txt`** ke `src/pages/surat/preview-surat.js`
   — ini WAJIB, karena `cetakSuratPDF` sekarang `async` (perlu menunggu
   gambar kop selesai dimuat sebelum PDF disimpan). Tanpa patch ini,
   PDF yang diunduh bisa saja tersimpan sebelum kop-nya sempat tertempel.
4. Jalankan `vercel dev` / build seperti biasa, lalu coba cetak satu
   surat untuk memastikan kop tampil dengan benar.

## Apa yang berubah

- Kop surat sebelumnya digambar manual pakai teks (`doc.text(...)`)
  yang hardcode "PEMERINTAH KOTA MALANG" dst. Sekarang memakai gambar
  kop asli yang Anda kirim, ditempel dengan `doc.addImage()`.
- Ditambahkan fungsi baru `cetakSuratTakmirPDF()` khusus untuk surat/
  undangan terbitan Langgar Al Muchtarom — belum dipakai di UI manapun
  karena fitur undangan belum dibangun, tapi sudah siap dipanggil nanti.
- Ada fallback teks kalau gambar kop gagal dimuat (mis. file belum
  ter-deploy), supaya proses cetak tidak berhenti total.

## Soal gaya bahasa template surat

`CONTOH_TEMPLATE_SURAT.md` berisi 2 contoh (Surat Keterangan Domisili
& Surat Keterangan Tidak Mampu) dengan gaya yang lebih sederhana
dari surat dinas pemerintahan tapi tetap baku dan layak dipakai untuk
keperluan administratif. Kolom `template_konten` di tabel `jenis_surat`
saat ini kosong untuk semua 13 jenis surat — jadi begitu gaya di 2
contoh ini dikonfirmasi cocok, saya bisa lanjutkan sekaligus untuk
11 jenis surat lainnya plus siapkan SQL `update`-nya.
