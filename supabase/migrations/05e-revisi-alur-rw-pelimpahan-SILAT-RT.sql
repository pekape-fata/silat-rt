-- =========================================================
-- SILAT RT — REVISI 05e: WILAYAH RW, ROLE RW, PELIMPAHAN WEWENANG,
--            PENGAJUAN SURAT PUBLIK (TANPA LOGIN)
-- Dijalankan SETELAH 05a, 05b, 05c, 05d
-- VERSI IDEMPOTEN — aman dijalankan ulang jika sempat gagal di tengah jalan
-- =========================================================

-- ---------------------------------------------------------
-- 1. WILAYAH RW (induk wilayah_rt)
-- ---------------------------------------------------------
create table if not exists public.wilayah_rw (
    id uuid primary key default gen_random_uuid(),
    nama_rw varchar(20) not null,
    kelurahan varchar(100) not null,
    kecamatan varchar(100) not null,
    kota varchar(100) not null,
    provinsi varchar(100) not null default 'Jawa Timur',
    created_at timestamptz not null default now(),
    unique (nama_rw, kelurahan)
);

alter table public.wilayah_rt
    add column if not exists wilayah_rw_id uuid references public.wilayah_rw(id) on delete restrict;

-- Data resmi lokasi
insert into public.wilayah_rw (nama_rw, kelurahan, kecamatan, kota, provinsi)
values ('RW 09', 'Purwantoro', 'Blimbing', 'Malang', 'Jawa Timur')
on conflict (nama_rw, kelurahan) do nothing;

update public.wilayah_rt
    set wilayah_rw_id = (select id from public.wilayah_rw where nama_rw = 'RW 09' and kelurahan = 'Purwantoro')
    where nama_rt = 'RT 01' and kelurahan = 'Purwantoro';

-- Jika belum ada baris wilayah_rt yang cocok (instalasi baru), buat langsung:
insert into public.wilayah_rt (nama_rt, nama_rw, kelurahan, kecamatan, kota, provinsi, wilayah_rw_id)
select 'RT 01', 'RW 09', 'Purwantoro', 'Blimbing', 'Malang', 'Jawa Timur',
       (select id from public.wilayah_rw where nama_rw = 'RW 09' and kelurahan = 'Purwantoro')
where not exists (
    select 1 from public.wilayah_rt where nama_rt = 'RT 01' and kelurahan = 'Purwantoro'
);

-- ---------------------------------------------------------
-- 2. ROLE BARU: Ketua RW, Sekretaris RW
-- ---------------------------------------------------------
insert into public.roles (nama_role, deskripsi) values
    ('Ketua RW', 'Pimpinan RW, tanda tangan tahap akhir surat pengantar'),
    ('Sekretaris RW', 'Verifikasi tingkat RW & TTD atas nama Ketua RW bila didelegasikan')
on conflict (nama_role) do nothing;

-- Pengurus RW disatukan ke tabel pengurus_rt dengan penanda wilayah_rw
-- (opsi lebih sederhana daripada tabel baru, karena pola datanya identik)
alter table public.pengurus_rt
    add column if not exists wilayah_rw_id uuid references public.wilayah_rw(id) on delete cascade;
alter table public.pengurus_rt
    alter column wilayah_rt_id drop not null;

alter table public.pengurus_rt
    drop constraint if exists pengurus_rt_jabatan_check;
alter table public.pengurus_rt
    add constraint pengurus_rt_jabatan_check
    check (jabatan in ('Ketua RT','Sekretaris RT','Bendahara RT','Ketua RW','Sekretaris RW'));

alter table public.pengurus_rt
    drop constraint if exists chk_pengurus_rt_scope;
alter table public.pengurus_rt
    add constraint chk_pengurus_rt_scope
    check (
        (wilayah_rt_id is not null and wilayah_rw_id is null and jabatan in ('Ketua RT','Sekretaris RT','Bendahara RT'))
        or
        (wilayah_rw_id is not null and wilayah_rt_id is null and jabatan in ('Ketua RW','Sekretaris RW'))
    );

-- Update nama_role langgar takmir tidak berubah (LAM = Langgar Al Muchtarom, sudah sesuai)
update public.langgar set nama_langgar = 'Langgar Waqaf Al Muchtarom Pandean 1'
    where nama_langgar ilike '%muchtarom%' or nama_langgar ilike '%al muchtarom%';

-- ---------------------------------------------------------
-- 3. PELIMPAHAN WEWENANG (DELEGASI TANDA TANGAN)
-- ---------------------------------------------------------
create table if not exists public.pelimpahan_wewenang (
    id uuid primary key default gen_random_uuid(),
    pemberi_wewenang_id uuid not null references public.users(id) on delete cascade,
    penerima_wewenang_id uuid not null references public.users(id) on delete cascade,
    alasan text not null,
    tanggal_mulai date not null,
    tanggal_selesai date not null,
    status varchar(15) not null default 'aktif' check (status in ('aktif','berakhir','dibatalkan')),
    dibuat_oleh uuid references public.users(id) on delete set null,
    created_at timestamptz not null default now(),
    check (tanggal_selesai >= tanggal_mulai)
);
create index if not exists idx_pelimpahan_pemberi on public.pelimpahan_wewenang(pemberi_wewenang_id, status);

-- Helper: cari siapa yang berwenang TTD saat ini untuk seorang pejabat tertentu
create or replace function public.penandatangan_aktif(pejabat_id uuid, tanggal date default current_date)
returns uuid
language sql
stable
as $$
    select coalesce(
        (select penerima_wewenang_id from public.pelimpahan_wewenang
         where pemberi_wewenang_id = pejabat_id
           and status = 'aktif'
           and tanggal between tanggal_mulai and tanggal_selesai
         order by created_at desc limit 1),
        pejabat_id
    )
$$;

-- ---------------------------------------------------------
-- 4. PERLUASAN TABEL SURAT: alur berjenjang RT -> RW
-- ---------------------------------------------------------
alter table public.surat
    drop constraint if exists surat_status_check;

alter table public.surat
    add column if not exists ditandatangani_rt_oleh uuid references public.users(id) on delete set null,
    add column if not exists ditandatangani_rw_oleh uuid references public.users(id) on delete set null,
    add column if not exists atas_nama_pelimpahan_rt boolean not null default false,
    add column if not exists atas_nama_pelimpahan_rw boolean not null default false,
    add column if not exists catatan_perbaikan text,
    add column if not exists no_hp_pemohon varchar(20),   -- dipakai saat pengajuan publik, sebelum warga terhubung akun
    add column if not exists diajukan_tanpa_login boolean not null default false,
    alter column status set default 'draf_publik';

alter table public.surat
    add constraint surat_status_check check (status in (
        'draf_publik',
        'menunggu_verifikasi',
        'perlu_perbaikan',
        'terverifikasi_sekretaris_rt',
        'ditandatangani_rt',
        'diteruskan_rw',
        'ditandatangani_rw',
        'terbit',
        'ditolak'
    ));

-- Izinkan warga_id kosong sementara (pengajuan publik dengan NIK belum tercocokkan ke data warga)
alter table public.surat alter column warga_id drop not null;
alter table public.surat
    add column if not exists nik_pemohon varchar(16),
    add column if not exists nama_pemohon varchar(150);

-- ---------------------------------------------------------
-- 5. RLS TAMBAHAN: PENGAJUAN PUBLIK TANPA LOGIN
-- ---------------------------------------------------------
-- Publik (role 'anon' Supabase) boleh INSERT pengajuan surat baru, tapi
-- tidak boleh SELECT/UPDATE data surat siapa pun (mencegah kebocoran data).
drop policy if exists "surat_public_insert" on public.surat;
create policy "surat_public_insert" on public.surat for insert
    to anon
    with check (
        status = 'draf_publik'
        and diajukan_tanpa_login = true
        and nik_pemohon is not null
        and nama_pemohon is not null
        and no_hp_pemohon is not null
    );

-- Sekretaris RT & RW bisa memproses tahap sesuai alur
drop policy if exists "surat_update_sekretaris_rt" on public.surat;
create policy "surat_update_sekretaris_rt" on public.surat for update
    using (public.is_admin() or public.current_role_name() = 'Sekretaris RT')
    with check (public.is_admin() or public.current_role_name() = 'Sekretaris RT');

drop policy if exists "surat_update_ketua_rt" on public.surat;
create policy "surat_update_ketua_rt" on public.surat for update
    using (public.is_admin() or public.current_role_name() = 'Ketua RT')
    with check (public.is_admin() or public.current_role_name() = 'Ketua RT');

drop policy if exists "surat_update_rw" on public.surat;
create policy "surat_update_rw" on public.surat for update
    using (public.is_admin() or public.current_role_name() in ('Ketua RW','Sekretaris RW'))
    with check (public.is_admin() or public.current_role_name() in ('Ketua RW','Sekretaris RW'));

alter table public.pelimpahan_wewenang enable row level security;
drop policy if exists "pelimpahan_select_authenticated" on public.pelimpahan_wewenang;
create policy "pelimpahan_select_authenticated" on public.pelimpahan_wewenang for select using (auth.role() = 'authenticated');
drop policy if exists "pelimpahan_write_pemberi_or_admin" on public.pelimpahan_wewenang;
create policy "pelimpahan_write_pemberi_or_admin" on public.pelimpahan_wewenang for all
    using (public.is_admin() or pemberi_wewenang_id = auth.uid())
    with check (public.is_admin() or pemberi_wewenang_id = auth.uid());

alter table public.wilayah_rw enable row level security;
drop policy if exists "wilayah_rw_select_authenticated" on public.wilayah_rw;
create policy "wilayah_rw_select_authenticated" on public.wilayah_rw for select using (true);
drop policy if exists "wilayah_rw_admin_write" on public.wilayah_rw;
create policy "wilayah_rw_admin_write" on public.wilayah_rw for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------
-- 6. NOTIFIKASI WA UNTUK PERBAIKAN/PENERBITAN (dicatat, dikirim manual via wa.me sesuai requirement)
-- ---------------------------------------------------------
create table if not exists public.notifikasi_surat (
    id uuid primary key default gen_random_uuid(),
    surat_id uuid not null references public.surat(id) on delete cascade,
    jenis varchar(30) not null check (jenis in ('perlu_perbaikan','terbit','ditolak')),
    pesan text not null,
    dikirim boolean not null default false,
    created_at timestamptz not null default now()
);
alter table public.notifikasi_surat enable row level security;
drop policy if exists "notifikasi_surat_select_pengurus" on public.notifikasi_surat;
create policy "notifikasi_surat_select_pengurus" on public.notifikasi_surat for select
    using (public.is_admin() or public.current_role_name() like '%RT' or public.current_role_name() like '%RW');
drop policy if exists "notifikasi_surat_insert_pengurus" on public.notifikasi_surat;
create policy "notifikasi_surat_insert_pengurus" on public.notifikasi_surat for insert
    with check (public.is_admin() or public.current_role_name() like '%RT' or public.current_role_name() like '%RW');
