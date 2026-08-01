# TAHAP 3 — USE CASE DIAGRAM
## SILAT RT (Sistem Informasi Langgar dan RT)

---

## 1. DAFTAR AKTOR

| Aktor | Kelompok |
|---|---|
| Administrator | Sistem |
| Ketua RT, Sekretaris RT, Bendahara RT | Pengurus RT |
| Ketua Takmir, Sekretaris Takmir, Bendahara Takmir | Pengurus Takmir |
| Imam | Takmir |
| Operator | Operasional |
| Warga | Umum |

---

## 2. USE CASE DIAGRAM — AKTOR ADMINISTRATOR

```mermaid
flowchart LR
    Admin((Administrator))
    Admin --> UC1([Kelola Hak Akses & Role])
    Admin --> UC2([Reset Password Pengguna])
    Admin --> UC3([Backup Database])
    Admin --> UC4([Restore Database])
    Admin --> UC5([Import Data Excel])
    Admin --> UC6([Export Data Excel])
    Admin --> UC7([Lihat Log Aktivitas])
    Admin --> UC8([Kelola Semua Modul RT & Takmir])
```

---

## 3. USE CASE DIAGRAM — PENGURUS RT

```mermaid
flowchart LR
    KetuaRT((Ketua RT))
    SekRT((Sekretaris RT))
    BendRT((Bendahara RT))

    KetuaRT --> UC10([Approve Surat])
    KetuaRT --> UC11([Tanda Tangan Digital Surat])
    KetuaRT --> UC12([Lihat Laporan Keuangan RT])
    KetuaRT --> UC13([Kelola Pengumuman RT])
    KetuaRT --> UC14([Kelola Agenda RT])

    SekRT --> UC15([Input & Update Data Warga])
    SekRT --> UC16([Buat Surat])
    SekRT --> UC17([Kelola Riwayat Pindah/Mutasi/Meninggal])
    SekRT --> UC14
    SekRT --> UC13

    BendRT --> UC18([Input Pemasukan/Pengeluaran Kas RT])
    BendRT --> UC19([Kelola Jenis Iuran])
    BendRT --> UC20([Generate Laporan Keuangan RT])
    BendRT --> UC21([Export Laporan PDF/Excel])
```

---

## 4. USE CASE DIAGRAM — PENGURUS TAKMIR

```mermaid
flowchart LR
    KetuaTakmir((Ketua Takmir))
    SekTakmir((Sekretaris Takmir))
    BendTakmir((Bendahara Takmir))

    KetuaTakmir --> UC30([Approve Surat Undangan])
    KetuaTakmir --> UC31([Kelola Data Pengurus Takmir])
    KetuaTakmir --> UC32([Lihat Laporan Keuangan Takmir])

    SekTakmir --> UC33([Kelola Profil Langgar])
    SekTakmir --> UC34([Kelola Jadwal Imam])
    SekTakmir --> UC35([Buat Surat Undangan])
    SekTakmir --> UC36([Kirim Undangan via WhatsApp])
    SekTakmir --> UC37([Kelola Agenda Takmir])
    SekTakmir --> UC38([Kelola Inventaris Langgar])

    BendTakmir --> UC39([Input Pemasukan/Pengeluaran Kas Takmir])
    BendTakmir --> UC40([Generate Laporan Keuangan Takmir])
    BendTakmir --> UC21b([Export Laporan PDF/Excel])
```

---

## 5. USE CASE DIAGRAM — IMAM, OPERATOR, WARGA

```mermaid
flowchart LR
    Imam((Imam))
    Operator((Operator))
    Warga((Warga))

    Imam --> UC50([Lihat Jadwal Imam Pribadi])
    Imam --> UC51([Konfirmasi Ketersediaan Jadwal])

    Operator --> UC52([Input Data Operasional Sesuai Penugasan])

    Warga --> UC53([Lihat Data Pribadi & KK])
    Warga --> UC54([Ajukan Permohonan Surat])
    Warga --> UC55([Lihat Status Iuran Pribadi])
    Warga --> UC56([Lihat Pengumuman & Agenda])
    Warga --> UC57([Lihat Jadwal Sholat & Jadwal Imam])
    Warga --> UC58([Scan/Verifikasi QR Surat])
```

---

## 6. RELASI INCLUDE/EXTEND PENTING

```mermaid
flowchart TD
    UC16[Buat Surat] -.include.-> UCa[Generate Nomor Surat Otomatis]
    UC16 -.include.-> UCb[Tempel TTD & Stempel Digital]
    UC16 -.include.-> UCc[Generate QR Verification]
    UC54[Ajukan Permohonan Surat] -.extend.-> UC16

    UC18[Input Transaksi Kas] -.include.-> UCd[Hitung Ulang Saldo Otomatis]
    UC20[Generate Laporan] -.include.-> UCe[Export PDF/Excel]

    UC35[Buat Surat Undangan] -.include.-> UCc
    UC36[Kirim via WhatsApp] -.include.-> UCf[Buka Link wa.me]
```

---

## 7. TABEL SPESIFIKASI USE CASE (RINGKASAN)

| Kode | Use Case | Aktor Utama | Precondition | Hasil Akhir |
|---|---|---|---|---|
| UC-16 | Buat Surat | Sekretaris RT | Data warga sudah ada di sistem | Surat PDF dengan nomor, TTD, QR |
| UC-18 | Input Transaksi Kas RT | Bendahara RT | Login sebagai Bendahara RT | Saldo terupdate, tercatat di log |
| UC-34 | Kelola Jadwal Imam | Sekretaris Takmir | Data pengurus/imam sudah ada | Jadwal berulang tersimpan |
| UC-36 | Kirim Undangan via WhatsApp | Sekretaris Takmir | Undangan sudah dibuat | Link wa.me terbuka dengan draf pesan |
| UC-54 | Ajukan Permohonan Surat | Warga | Warga sudah login & terdaftar | Permohonan masuk antrian approval |
| UC-58 | Scan/Verifikasi QR Surat | Siapa saja (publik) | Surat memiliki QR Code | Status keaslian surat ditampilkan |

---

## 8. STATUS TAHAP

✅ **Tahap 3 selesai**: Use Case Diagram lengkap per kelompok aktor (Administrator, Pengurus RT, Pengurus Takmir, Imam/Operator/Warga), relasi include/extend, dan tabel spesifikasi use case.

Menunggu konfirmasi Anda sebelum lanjut ke **Tahap 4: ERD (Entity Relationship Diagram)**.
