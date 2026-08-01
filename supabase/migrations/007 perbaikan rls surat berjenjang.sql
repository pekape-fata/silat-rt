-- =========================================================
-- SILAT RT — REVISI 007: PERBAIKAN RLS SURAT (VISIBILITAS RW +
--            PENJAGAAN TAHAPAN STATUS ALUR BERJENJANG)
-- Dijalankan SETELAH 001-006
--
-- MASALAH YANG DIPERBAIKI:
-- 1. Ketua RW / Sekretaris RW tidak pernah diberi izin SELECT pada
--    tabel surat (policy "surat_select_scope" di 002 hanya menyebut
--    Ketua RT/Sekretaris RT), padahal 005 memberi mereka izin UPDATE.
--    Halaman approval RW akan selalu kosong tanpa perbaikan ini.
-- 2. Policy update dari 002 ("surat_update_pengurus") dan 005
--    ("surat_update_sekretaris_rt/ketua_rt/rw") aktif bersamaan dan
--    saling OR — sehingga Sekretaris RT / Ketua RT bisa mengubah
--    status surat ke NILAI APA SAJA, termasuk lompat langsung ke
--    'terbit', melewati alur tanda tangan berjenjang.
--    Perbaikan ini mengganti seluruh policy update surat dengan versi
--    yang menjaga: (a) hanya role yang tepat di tahap tersebut yang
--    boleh mengubah, dan (b) status baru harus valid untuk tahap itu.
-- =========================================================

-- ---------------------------------------------------------
-- 1. SELECT — tambahkan Ketua RW & Sekretaris RW
-- ---------------------------------------------------------
drop policy if exists "surat_select_scope" on public.surat;
create policy "surat_select_scope" on public.surat for select
    using (
        public.is_admin()
        or warga_id = public.current_warga_id()
        or public.current_role_name() in ('Ketua RT','Sekretaris RT','Ketua RW','Sekretaris RW')
    );

-- ---------------------------------------------------------
-- 2. UPDATE — hapus SEMUA policy update lama yang saling tumpang
--    tindih (dari 002 dan 005), ganti dengan versi bertahap
-- ---------------------------------------------------------
drop policy if exists "surat_update_pengurus" on public.surat;          -- dari 002, terlalu longgar
drop policy if exists "surat_update_sekretaris_rt" on public.surat;     -- dari 005, tanpa penjagaan status
drop policy if exists "surat_update_ketua_rt" on public.surat;          -- dari 005, tanpa penjagaan status
drop policy if exists "surat_update_rw" on public.surat;                -- dari 005, tanpa penjagaan status

-- Tahap 1: Sekretaris RT memverifikasi pengajuan baru / yang sudah diperbaiki warga
create policy "surat_update_sekretaris_rt" on public.surat for update
    using (
        public.is_admin()
        or (public.current_role_name() = 'Sekretaris RT'
            and status in ('menunggu_verifikasi','perlu_perbaikan'))
    )
    with check (
        public.is_admin()
        or (public.current_role_name() = 'Sekretaris RT'
            and status in ('terverifikasi_sekretaris_rt','perlu_perbaikan','ditolak'))
    );

-- Tahap 2: Ketua RT menandatangani surat yang sudah diverifikasi Sekretaris RT
create policy "surat_update_ketua_rt" on public.surat for update
    using (
        public.is_admin()
        or (public.current_role_name() = 'Ketua RT'
            and status = 'terverifikasi_sekretaris_rt')
    )
    with check (
        public.is_admin()
        or (public.current_role_name() = 'Ketua RT'
            and status in ('ditandatangani_rt','diteruskan_rw','ditolak'))
    );

-- Tahap 3: Ketua RW / Sekretaris RW menandatangani & menerbitkan surat
create policy "surat_update_rw" on public.surat for update
    using (
        public.is_admin()
        or (public.current_role_name() in ('Ketua RW','Sekretaris RW')
            and status in ('ditandatangani_rt','diteruskan_rw'))
    )
    with check (
        public.is_admin()
        or (public.current_role_name() in ('Ketua RW','Sekretaris RW')
            and status in ('ditandatangani_rw','terbit','ditolak'))
    );

-- ---------------------------------------------------------
-- CATATAN:
-- Sesuaikan daftar status di klausa "with check" pada masing-masing
-- policy di atas kalau nanti alur pasti di halaman approval-surat.js
-- (yang belum dibuat saat file ini ditulis) ternyata berbeda urutan
-- transisinya dari yang diasumsikan di sini.
-- =========================================================
