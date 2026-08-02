-- =========================================================
-- SILAT RT — 016_aktifkan_batasi_undangan_lintas_langgar.sql
--
-- Migrasi 013 (opsional) sebelumnya sengaja tidak diaktifkan karena
-- fitur Undangan belum dibangun di UI, jadi belum ada bukti apakah
-- visibilitas lintas-langgar itu bug atau desain. Sekarang fitur
-- sudah nyata dipakai per-langgar (halaman Undangan mengikuti pola
-- yang sama seperti Kas Takmir: satu `langgarAktif` per pengurus),
-- jadi migrasi ini AMAN dan DISARANKAN dijalankan sekarang.
--
-- File ini idempotent (aman dijalankan meski 013 belum/sudah pernah
-- di-uncomment sebagian).
-- =========================================================

drop policy if exists "undangan_select_scope" on public.surat_undangan;
create policy "undangan_select_scope" on public.surat_undangan for select
    using (
        public.is_admin()
        or langgar_id in (select * from public.current_langgar_ids())
    );

drop policy if exists "undangan_penerima_select_scope" on public.undangan_penerima;
create policy "undangan_penerima_select_scope" on public.undangan_penerima for select
    using (
        public.is_admin()
        or warga_id = public.current_warga_id()
        or undangan_id in (
            select su.id from public.surat_undangan su
            where su.langgar_id in (select * from public.current_langgar_ids())
        )
    );

-- =========================================================
-- VERIFIKASI:
-- Login sebagai Sekretaris/Ketua Takmir Langgar A -> buka halaman
-- Undangan -> hanya undangan & daftar penerima Langgar A yang
-- tampil, bukan langgar lain.
-- =========================================================
