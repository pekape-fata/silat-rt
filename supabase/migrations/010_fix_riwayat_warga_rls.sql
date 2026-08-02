-- =========================================================
-- SILAT RT — 010_fix_riwayat_warga_rls.sql
-- Dijalankan SETELAH 001-009 (termasuk 009_perbaikan_akses_publik_dan_role.sql)
--
-- BUG YANG DIPERBAIKI:
-- Policy "riwayat_warga_select_scope" (lihat 002_rls_policies.sql,
-- baris ~201) memakai subquery:
--     warga_id in (select id from public.warga)
-- yaitu SELURUH id warga tanpa filter apa pun. Akibatnya syarat ini
-- nyaris selalu bernilai benar untuk baris manapun, sehingga siapa
-- pun yang login (warga biasa sekalipun) bisa membaca riwayat SEMUA
-- warga di SELURUH RT, bukan hanya riwayat dirinya sendiri atau
-- warga di RT yang sama.
--
-- PERBAIKAN:
-- Menyamakan pola scope dengan policy "warga_select_scope" yang
-- sudah benar (002_rls_policies.sql, baris ~188-190): admin, warga
-- bersangkutan, atau siapa pun yang berada di RT yang sama lewat
-- relasi kartu_keluarga.wilayah_rt_id.
-- =========================================================

drop policy if exists "riwayat_warga_select_scope" on public.riwayat_warga;

create policy "riwayat_warga_select_scope" on public.riwayat_warga for select
    using (
        public.is_admin()
        or warga_id = public.current_warga_id()
        or warga_id in (
            select w.id
            from public.warga w
            join public.kartu_keluarga kk on w.kk_id = kk.id
            where kk.wilayah_rt_id = public.current_wilayah_rt_id()
        )
    );

-- =========================================================
-- VERIFIKASI:
-- 1. Login sebagai warga biasa dari RT A (bukan admin/pengurus).
-- 2. select * from riwayat_warga;
-- 3. Hasil yang benar: hanya muncul riwayat warga di RT A,
--    bukan riwayat warga dari RT lain.
-- =========================================================
