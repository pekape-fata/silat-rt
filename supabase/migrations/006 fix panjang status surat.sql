-- =========================================================
-- SILAT RT — REVISI 006: PERBAIKAN PANJANG KOLOM status
-- Dijalankan SETELAH 001-005
--
-- LATAR BELAKANG:
-- Kolom public.surat.status dibuat sebagai varchar(20) di migration 001,
-- lalu migration 005 (alur RW & pelimpahan) menambahkan nilai status baru
-- yang lebih panjang dari 20 karakter (mis. 'terverifikasi_sekretaris_rt' = 27
-- karakter), tanpa memperbesar tipe kolomnya. Akibatnya insert/update ke
-- status tersebut gagal dengan error:
--   "value too long for type character varying(20)"
-- =========================================================

-- 1. Drop dulu policy yang bergantung pada kolom status
--    (Postgres tidak izinkan ALTER COLUMN TYPE selama ada policy yang memakainya)
drop policy if exists "surat_public_insert" on public.surat;

-- 2. Perbesar kolom status agar muat nilai status terpanjang di alur berjenjang
alter table public.surat
    alter column status type varchar(40);

-- 3. Buat ulang policy persis seperti semula (dari migration 005)
create policy "surat_public_insert" on public.surat for insert
    to anon
    with check (
        status = 'draf_publik'
        and diajukan_tanpa_login = true
        and nik_pemohon is not null
        and nama_pemohon is not null
        and no_hp_pemohon is not null
    );
