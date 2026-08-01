# TAHAP 7 — STRUKTUR FOLDER PROJECT
## SILAT RT (Sistem Informasi Langgar dan RT)

Struktur disusun untuk stack **HTML5/CSS3/JS ES6/Bootstrap 5 + Supabase**, tanpa build tool wajib (bisa langsung di-deploy ke Vercel sebagai static site), namun tetap modular agar mudah dikembangkan.

```
silat-rt/
├── .github/
│   └── workflows/
│       └── deploy.yml                 # CI: lint + deploy check tiap push ke main
│
├── public/                            # Aset statis & PWA
│   ├── icons/                         # Ikon PWA berbagai ukuran (72–512px)
│   ├── manifest.webmanifest           # Konfigurasi PWA (nama, warna tema, ikon)
│   ├── service-worker.js              # Cache offline & strategi network-first/cache-first
│   ├── favicon.ico
│   └── og-image.png
│
├── src/
│   ├── assets/
│   │   ├── css/
│   │   │   ├── tokens.css             # CSS variables — hasil Tahap 6 (warna, tipografi, radius)
│   │   │   ├── base.css               # Reset, typography, utility classes
│   │   │   ├── components.css         # Card, button, chip, list-item, stepper, ring, dsb.
│   │   │   └── themes.css             # [data-theme="dark"] overrides
│   │   ├── fonts/                     # Self-host Sora, Plus Jakarta Sans, IBM Plex Mono
│   │   └── img/
│   │       └── placeholders/
│   │
│   ├── lib/
│   │   ├── supabaseClient.js          # Inisialisasi Supabase client (URL + anon key dari env)
│   │   ├── auth.js                    # Login (username→email sintetis), logout, session guard
│   │   ├── rbac.js                    # Helper cek role & render menu sesuai hak akses (Tahap 5 RLS mirror di frontend)
│   │   ├── format.js                  # Format rupiah, tanggal Indonesia, nomor surat
│   │   ├── qrcode.js                  # Generate & render QR Code (surat, undangan, identitas warga)
│   │   ├── pdf.js                     # Generate PDF surat/laporan (mis. via jsPDF)
│   │   ├── excel.js                   # Import/export Excel (mis. via SheetJS)
│   │   ├── whatsapp.js                # Helper bangun link wa.me dari template pesan
│   │   └── realtime.js                # Subscribe channel Supabase Realtime per modul
│   │
│   ├── components/                    # Web component / partial HTML+JS yang dipakai berulang
│   │   ├── top-app-bar.js
│   │   ├── bottom-nav.js
│   │   ├── stat-card.js
│   │   ├── ring-status.js
│   │   ├── list-item.js
│   │   ├── toast.js
│   │   ├── modal-sheet.js
│   │   └── skeleton-loader.js
│   │
│   ├── pages/                         # 1 folder = 1 modul, isi html + js per halaman (42 halaman Tahap 6-B)
│   │   ├── auth/
│   │   │   ├── login.html / login.js
│   │   │   ├── lupa-password.html / .js
│   │   │   └── profil-saya.html / .js
│   │   ├── dashboard/
│   │   │   ├── dashboard-pengurus.html / .js
│   │   │   └── dashboard-warga.html / .js
│   │   ├── kependudukan/
│   │   │   ├── daftar-warga.html / .js
│   │   │   ├── detail-warga.html / .js
│   │   │   ├── form-warga.html / .js
│   │   │   ├── daftar-kk.html / .js
│   │   │   ├── detail-kk.html / .js
│   │   │   ├── riwayat-warga.html / .js
│   │   │   └── kartu-identitas.html / .js
│   │   ├── surat/
│   │   │   ├── jenis-surat.html / .js
│   │   │   ├── ajukan-surat.html / .js
│   │   │   ├── antrian-surat.html / .js
│   │   │   ├── approval-surat.html / .js
│   │   │   ├── preview-surat.html / .js
│   │   │   └── verifikasi-surat.html / .js      # halaman publik, tanpa auth guard
│   │   ├── keuangan-rt/
│   │   │   ├── ringkasan-kas-rt.html / .js
│   │   │   ├── transaksi-kas-rt.html / .js
│   │   │   ├── form-transaksi-rt.html / .js
│   │   │   ├── jenis-iuran.html / .js
│   │   │   └── laporan-kas-rt.html / .js
│   │   ├── keuangan-takmir/
│   │   │   ├── ringkasan-kas-takmir.html / .js
│   │   │   ├── transaksi-kas-takmir.html / .js
│   │   │   ├── kategori-kas-takmir.html / .js
│   │   │   └── laporan-kas-takmir.html / .js
│   │   ├── takmir/
│   │   │   ├── profil-langgar.html / .js
│   │   │   ├── pengurus-takmir.html / .js
│   │   │   ├── jadwal-imam.html / .js
│   │   │   ├── jadwal-sholat.html / .js
│   │   │   ├── inventaris.html / .js
│   │   │   ├── daftar-undangan.html / .js
│   │   │   ├── form-undangan.html / .js
│   │   │   └── verifikasi-undangan.html / .js   # halaman publik
│   │   ├── agenda-pengumuman/
│   │   │   ├── kalender-agenda.html / .js
│   │   │   ├── form-agenda.html / .js
│   │   │   └── pengumuman.html / .js
│   │   └── admin/
│   │       ├── kelola-pengguna.html / .js
│   │       ├── backup-restore.html / .js
│   │       └── log-aktivitas.html / .js
│   │
│   ├── router.js                      # Client-side routing ringan (hash/History API) + auth guard per role
│   └── app.js                         # Entry point: init Supabase, router, service worker, theme
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_schema.sql             # = 05a-schema-SILAT-RT.sql
│   │   ├── 002_rls_policies.sql       # = 05b-rls-policies-SILAT-RT.sql
│   │   ├── 003_auth_storage_realtime.sql  # = 05c
│   │   └── 004_username_login.sql     # = 05d (revisi login username)
│   └── seed/
│       └── seed_demo.sql              # Data contoh untuk testing lokal
│
├── android/                            # Wrapper APK (Tahap 13 — Trusted Web Activity/Capacitor)
│   └── (di-generate otomatis oleh Bubblewrap/Capacitor saat Tahap 13)
│
├── docs/                               # Seluruh dokumen hasil Tahap 1-6 disimpan di sini
│   ├── 01-analisis-kebutuhan.md
│   ├── 02-flowchart.md
│   ├── 03-usecase.md
│   ├── 04-erd.md
│   ├── 05-database.md
│   └── 06-uiux.md
│
├── .env.example                        # Template variabel lingkungan (SUPABASE_URL, SUPABASE_ANON_KEY)
├── .gitignore
├── vercel.json                         # Konfigurasi routing & header untuk Vercel
├── package.json                        # Dependensi minor (jsPDF, SheetJS, dsb) + skrip lokal
└── README.md                            # Panduan setup, deploy, dan kontribusi
```

---

## 2. PRINSIP PENAMAAN & ORGANISASI

- **1 folder = 1 modul** di `src/pages/` — memudahkan penugasan RLS/role dan mempermudah tim lanjutan menavigasi tanpa harus paham keseluruhan sistem.
- **Tidak pakai framework build (React/Vue) sesuai requirement wajib** — cukup HTML+CSS+ES6 modul native (`<script type="module">`) + Bootstrap 5 dari CDN, sehingga tetap bisa langsung di-deploy statis ke Vercel tanpa proses build kompleks.
- **`lib/` vs `components/`**: `lib/` berisi fungsi murni (logika, tanpa DOM), `components/` berisi elemen UI yang bisa dipasang ulang di banyak halaman.
- **File SQL di `supabase/migrations/` diberi nomor urut** — memudahkan tracking versi skema dan proses migrasi ulang di environment baru.
- **`docs/`** menyimpan seluruh output Tahap 1-6 sebagai dokumentasi hidup project, bukan hanya arsip sekali pakai.

---

## 3. KONVENSI GIT BRANCH

| Branch | Fungsi |
|---|---|
| `main` | Production — otomatis ter-deploy ke Vercel |
| `develop` | Integrasi fitur sebelum rilis |
| `feature/<nama-modul>` | Pengembangan 1 modul (mis. `feature/modul-surat`) |
| `fix/<deskripsi-singkat>` | Perbaikan bug |

---

## 4. STATUS TAHAP

✅ **Tahap 7 selesai**: Struktur folder lengkap (frontend, Supabase migrations, docs, android wrapper), prinsip organisasi, dan konvensi Git branch.

**Revisi tambahan sebelum tahap ini**: login diubah dari email menjadi **username sederhana** (mis. `ketua.rt`, `sekretaris.lam`, `bendahara.rt`) — sudah ditambahkan sebagai `05d-revisi-username-login-SILAT-RT.sql` dan mockup login (`06c`) sudah diperbarui.

Menunggu konfirmasi Anda sebelum lanjut ke **Tahap 8: Source Code Frontend**.
