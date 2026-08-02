# Contoh Templat Isi Surat (gaya non-dinas, tetap sopan)

Catatan: kolom `template_konten` di tabel `jenis_surat` saat ini masih
kosong untuk semua 13 jenis surat (lihat seed data di
`001_schema.sql`) — jadi ini bukan mengganti template lama, melainkan
mengisi yang memang belum ada.

Placeholder `{...}` disesuaikan dengan kolom yang tersedia di tabel
`warga`/`kartu_keluarga`/`surat` — sebutkan kalau ada nama kolom yang
beda supaya saya sesuaikan.

---

## 1. Surat Keterangan Domisili

```
Yang bertanda tangan di bawah ini, Ketua RT 001 RW 009 Kelurahan
Purwantoro, Kecamatan Blimbing, Kota Malang, dengan ini menerangkan
bahwa:

Nama              : {nama_warga}
NIK               : {nik}
Tempat/Tgl Lahir  : {tempat_lahir}, {tanggal_lahir}
Jenis Kelamin     : {jenis_kelamin}
Alamat            : {alamat}

benar merupakan warga yang berdomisili di alamat tersebut di atas dan
tercatat aktif dalam data kependudukan RT 001 RW 009.

Surat keterangan ini dibuat untuk keperluan {keperluan} dan
dipergunakan sebagaimana mestinya.
```

## 2. Surat Keterangan Tidak Mampu

```
Yang bertanda tangan di bawah ini, Ketua RT 001 RW 009 Kelurahan
Purwantoro, Kecamatan Blimbing, Kota Malang, dengan ini menerangkan
bahwa:

Nama              : {nama_warga}
NIK               : {nik}
Alamat            : {alamat}
Pekerjaan         : {pekerjaan}

adalah benar warga RT 001 RW 009 yang menurut sepengetahuan kami
termasuk keluarga dengan kondisi ekonomi kurang mampu.

Surat keterangan ini dibuat dengan sebenarnya untuk keperluan
{keperluan} dan dapat dipergunakan sebagaimana mestinya.
```

---

Perbandingan singkat dengan gaya surat dinas pemerintahan yang
dihindari: tidak memakai struktur "Menimbang / Mengingat / Memutuskan"
ala peraturan, dan tidak memakai sapaan birokratis berlapis — tapi
tetap memakai kalimat baku, identitas lengkap, dan penutup resmi
supaya layak dipakai untuk keperluan administratif (bank, sekolah,
dinas sosial, dst).

Jenis surat lain yang masih kosong templatnya (11 lagi): Surat
Pengantar KTP/KK/SKCK/Nikah/Cerai/Akta Lahir/Akta Mati, Surat
Keterangan Usaha, Surat Keterangan Beasiswa, Surat Keterangan
Kehilangan, Surat Keterangan Pindah. Beri tahu saya kalau contoh
di atas sudah pas gayanya, saya lanjutkan ke semuanya sekaligus.
