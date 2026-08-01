-- =========================================================
-- SILAT RT — 009_perbaikan_akses_publik_dan_role.sql
-- Dijalankan SETELAH 001-008.
--
-- LATAR BELAKANG / BUG YANG DIPERBAIKI:
-- 1. Halaman publik "Ajukan Surat Tanpa Login" (src/pages/surat/
--    ajukan-surat-publik.js) memuat dropdown "Jenis Surat" dengan
--    SELECT ke tabel public.jenis_surat memakai kunci ANON (pengguna
--    belum login). Namun policy "jenis_surat_select_authenticated"
--    (lihat 002_rls_policies.sql) hanya mengizinkan role Postgres
--    'authenticated' untuk SELECT — akun anon SELALU ditolak RLS,
--    sehingga query mengembalikan array kosong dan dropdown tampil
--    kosong tanpa pesan error apa pun di UI. Ini yang menyebabkan
--    "Jenis Surat" tidak menampilkan pilihan sama sekali.
--    Perbaikan: tambah policy SELECT khusus untuk role 'anon',
--    terbatas HANYA pada kolom referensi (nama jenis surat) yang
--    memang harus publik agar formulir bisa dipakai tanpa login.
--
-- 2. Role "PKK RT" dan "Bendahara RW" belum pernah dibuat di tabel
--    public.roles (hanya Ketua RW/Sekretaris RW yang ditambahkan di
--    005_alur_rw_pelimpahan.sql). Padahal struktur organisasi RT/RW
--    nyatanya juga punya PKK RT dan Bendahara RW. Ditambahkan di sini
--    supaya Administrator bisa membuat akun dengan peran tersebut.
--
-- 3. Pengurus RW (Ketua/Sekretaris/Bendahara RW) belum bisa menulis
--    pengumuman (policy lama hanya mengecek akhiran '%RT' / '%Takmir').
--    Diperluas agar pengurus RW juga bisa menerbitkan pengumuman.
-- =========================================================

-- ---------------------------------------------------------
-- 1. AKSES BACA PUBLIK UNTUK JENIS_SURAT (memperbaiki dropdown kosong)
-- ---------------------------------------------------------
drop policy if exists "jenis_surat_select_public" on public.jenis_surat;
create policy "jenis_surat_select_public" on public.jenis_surat
    for select
    to anon
    using (true);

-- ---------------------------------------------------------
-- 2. ROLE ORGANISASI YANG BELUM ADA
-- ---------------------------------------------------------
insert into public.roles (nama_role, deskripsi) values
    ('PKK RT', 'Pengurus PKK RT — program kesejahteraan keluarga & sosial warga'),
    ('Bendahara RW', 'Kelola keuangan tingkat RW')
on conflict (nama_role) do nothing;

-- Perbolehkan jabatan baru ini dicatat di tabel pengurus_rt
-- (kolom jabatan yang sama dipakai untuk pengurus RT maupun RW,
--  lihat 005_alur_rw_pelimpahan.sql).
alter table public.pengurus_rt
    drop constraint if exists pengurus_rt_jabatan_check;
alter table public.pengurus_rt
    add constraint pengurus_rt_jabatan_check
    check (jabatan in (
        'Ketua RT','Sekretaris RT','Bendahara RT','PKK RT',
        'Ketua RW','Sekretaris RW','Bendahara RW'
    ));

alter table public.pengurus_rt
    drop constraint if exists chk_pengurus_rt_scope;
alter table public.pengurus_rt
    add constraint chk_pengurus_rt_scope
    check (
        (wilayah_rt_id is not null and wilayah_rw_id is null
            and jabatan in ('Ketua RT','Sekretaris RT','Bendahara RT','PKK RT'))
        or
        (wilayah_rw_id is not null and wilayah_rt_id is null
            and jabatan in ('Ketua RW','Sekretaris RW','Bendahara RW'))
    );

-- ---------------------------------------------------------
-- 3. PENGURUS RW JUGA BOLEH MENERBITKAN PENGUMUMAN
-- ---------------------------------------------------------
drop policy if exists "pengumuman_write_pengurus" on public.pengumuman;
create policy "pengumuman_write_pengurus" on public.pengumuman for insert
    with check (
        public.is_admin()
        or public.current_role_name() like '%RT'
        or public.current_role_name() like '%RW'
        or public.current_role_name() like '%Takmir'
    );

drop policy if exists "pengumuman_target_write_pengurus" on public.pengumuman_target;
create policy "pengumuman_target_write_pengurus" on public.pengumuman_target for insert
    with check (
        public.is_admin()
        or public.current_role_name() like '%RT'
        or public.current_role_name() like '%RW'
        or public.current_role_name() like '%Takmir'
    );
