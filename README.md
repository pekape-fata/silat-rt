# SILAT RT — Sistem Informasi Langgar dan RT

Aplikasi administrasi terpadu untuk **RT 01 / RW 09, Kelurahan Purwantoro, Kecamatan Blimbing, Kota Malang** dan **Langgar Waqaf Al Muchtarom Pandean 1**.

Stack: HTML5 + CSS3 + JavaScript ES6 (tanpa build tool wajib) + Bootstrap 5 + Supabase (Postgres, Auth, Realtime, Storage, RLS) + Vercel + GitHub. 100% berjalan di free tier.

---

## ⚠️ STATUS PENGERJAAN (baca dulu sebelum deploy)

Proyek ini dikerjakan bertahap (13 tahap). Status saat file ini dibuat:

| Tahap | Status |
|---|---|
| 1. Analisis Kebutuhan | ✅ Selesai — `docs/01-analisis-kebutuhan.md` |
| 2. Flowchart | ✅ Selesai — `docs/02-flowchart.md` |
| 3. Use Case Diagram | ✅ Selesai — `docs/03-usecase.md` |
| 4. ERD | ✅ Selesai — `docs/04-erd.md` |
| 5. Struktur Database Supabase | ✅ Selesai — `supabase/migrations/001-005` |
| 6. UI/UX Seluruh Halaman | ✅ Selesai (design system + 42 halaman site map + mockup 7 layar) — `docs/06a-06c` |
| 7. Struktur Folder Project | ✅ Selesai |
| 8. Source Code Frontend | 🟡 **Sebagian** — modul Autentikasi & Surat (alur publik → Sekretaris RT → Ketua RT → Ketua RW) sudah jadi dan fungsional (simpan/edit/cetak). Modul **Warga, Keuangan RT, Keuangan Takmir, Takmir/Langgar, Agenda-Pengumuman, Admin, dan Dashboard belum dibuat** — baru berupa halaman kosong/belum ada. |
| 9. Source Code Backend (RPC/Edge Function) | ⬜ Belum dikerjakan |
| 10. SQL Supabase final | 🟡 Sudah ada 5 file migration inti, tapi bisa bertambah seiring modul baru di Tahap 8 dibuat |
| 11. Deployment GitHub | ⬜ Belum — panduan di bawah, tinggal Anda jalankan |
| 12. Deployment Vercel | ⬜ Belum — panduan di bawah, tinggal Anda jalankan |
| 13. Build APK Android | ⬜ Belum dikerjakan |

**Artinya**: paket ini SUDAH BISA di-deploy ke Supabase + GitHub + Vercel sekarang untuk mulai pengujian alur Login dan alur Surat (pengajuan publik → verifikasi → TTD berjenjang → cetak PDF) — tapi modul-modul lain di dashboard belum akan berfungsi karena halamannya belum dibuat. Deploy sekarang tetap disarankan agar Anda bisa mulai menguji sambil modul lain menyusul.

---

## 1. SETUP SUPABASE

1. Buat project baru di [supabase.com](https://supabase.com) (free tier).
2. Buka **SQL Editor**, jalankan file di `supabase/migrations/` **berurutan sesuai nomor**:
   - `001_schema.sql`
   - `002_rls_policies.sql`
   - `003_auth_storage_realtime.sql`
   - `004_username_login.sql`
   - `005_alur_rw_pelimpahan.sql`
3. Buka **Project Settings > API**, catat `Project URL` dan `anon public key`.
4. Buat akun pengurus pertama (Administrator) secara manual:
   - Buka **Authentication > Users > Add User**, isi email `admin@silatrt.local` dan password.
   - Di **Table Editor > users**, ubah `role_id` baris yang baru dibuat ke role `Administrator`, dan isi kolom `username` = `admin`.
   - Ulangi untuk `ketua.rt`, `sekretaris.rt`, dst — email selalu `{username}@silatrt.local`.

---

## 2. SETUP GITHUB

```bash
cd silat-rt
git init
git add .
git commit -m "Initial commit: SILAT RT Tahap 1-8 (parsial)"
git branch -M main
git remote add origin https://github.com/<username-anda>/silat-rt.git
git push -u origin main
```

Buat branch `develop` untuk pengembangan modul lanjutan:
```bash
git checkout -b develop
git push -u origin develop
```

Tambahkan **Repository Secrets** (Settings > Secrets and variables > Actions) agar workflow `.github/workflows/deploy.yml` berjalan:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

---

## 3. SETUP VERCEL

1. Login ke [vercel.com](https://vercel.com), klik **Add New Project**, import repo GitHub `silat-rt`.
2. Framework preset: pilih **Other** (project ini statis, tanpa framework).
3. Build Command: `node scripts/generate-env.js` (sudah diatur di `vercel.json`).
4. Output Directory: `.` (root).
5. Tambahkan **Environment Variables**:
   - `SUPABASE_URL` = URL project Supabase Anda
   - `SUPABASE_ANON_KEY` = anon public key Supabase Anda
6. Klik **Deploy**.

Setelah deploy pertama berhasil, setiap `git push` ke `main` akan otomatis re-deploy (default Vercel + GitHub integration).

---

## 4. MENJALANKAN SECARA LOKAL (opsional, untuk development)

```bash
cp .env.example .env       # isi manual, lalu jalankan generate-env
node scripts/generate-env.js
npm run dev                 # membuka http://localhost:5173 via `serve`
```

---

## 5. STRUKTUR PROJECT

Lihat `docs/07-struktur-folder.md` untuk penjelasan lengkap tiap folder.

```
silat-rt/
├── docs/                  # Seluruh dokumen Tahap 1-7 (analisis s.d. struktur folder)
├── supabase/migrations/   # 5 file SQL bernomor urut — jalankan berurutan
├── public/                # PWA: manifest, service worker, env.js (auto-generate di Vercel)
├── src/
│   ├── assets/css/        # Design tokens hasil Tahap 6
│   ├── lib/                # Logika murni: auth, rbac, format, whatsapp, pdf
│   ├── pages/               # 1 folder = 1 modul (baru "auth" & "surat" yang lengkap)
│   ├── router.js
│   └── app.js
├── scripts/generate-env.js
├── vercel.json
├── package.json
└── index.html
```

---

## 6. LANGKAH SELANJUTNYA YANG DISARANKAN

1. Deploy dulu paket ini (Supabase → GitHub → Vercel) untuk memastikan alur Login & Surat berjalan di lingkungan nyata.
2. Lanjutkan Tahap 8 untuk modul: Warga, Keuangan RT, Keuangan Takmir, Takmir/Langgar, Agenda-Pengumuman, Admin, Dashboard — mengikuti pola arsitektur yang sama seperti modul Surat (`src/pages/surat/`).
3. Lanjut ke Tahap 9 (backend/RPC untuk logika lebih kompleks, mis. generate nomor surat otomatis via Postgres function, bukan di frontend).
4. Tahap 13: bungkus PWA ini jadi APK menggunakan [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) (gratis, berbasis Trusted Web Activity) setelah domain Vercel aktif.
