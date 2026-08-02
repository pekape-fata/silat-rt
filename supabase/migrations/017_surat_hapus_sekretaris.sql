-- =========================================================
-- SILAT RT — 017_surat_hapus_sekretaris.sql
--
-- MASALAH: Sekretaris RT tidak bisa MENGHAPUS (Hapus) pengajuan surat
-- sama sekali — tidak ada policy DELETE apa pun untuk tabel `surat`
-- sejak awal (hanya SELECT/INSERT/UPDATE yang diatur di 002/005/007).
-- Tombol "Hapus" di UI akan selalu gagal dengan error RLS tanpa
-- migrasi ini.
--
-- CATATAN: INSERT langsung oleh Sekretaris RT/Ketua RT (untuk fitur
-- "Tambah Surat Baru") TIDAK butuh migrasi baru — policy
-- "surat_insert_scope" dari 002_rls_policies.sql sudah mengizinkan
-- role Ketua RT/Sekretaris RT/Admin melakukan INSERT bebas.
--
-- KEBIJAKAN HAPUS DIBATASI hanya untuk surat yang BELUM resmi
-- (belum ditandatangani/bernomor) — supaya surat yang sudah terbit
-- tidak bisa dihapus begitu saja (jejak audit harus tetap utuh; kalau
-- sudah terlanjur terbit dan keliru, alurnya harus lewat status
-- 'ditolak', bukan dihapus).
-- =========================================================

drop policy if exists "surat_delete_sekretaris_rt" on public.surat;
create policy "surat_delete_sekretaris_rt" on public.surat for delete
    using (
        public.is_admin()
        or (
            public.current_role_name() = 'Sekretaris RT'
            and status in ('draf_publik', 'menunggu_verifikasi', 'perlu_perbaikan', 'terverifikasi_sekretaris_rt')
            and nomor_surat is null
        )
    );

-- =========================================================
-- VERIFIKASI:
-- - Login sebagai Sekretaris RT, coba hapus surat berstatus
--   'menunggu_verifikasi' -> harus berhasil.
-- - Coba hapus surat berstatus 'ditandatangani_rt' atau yang sudah
--   punya nomor_surat -> harus DITOLAK RLS (melindungi surat resmi).
-- =========================================================
