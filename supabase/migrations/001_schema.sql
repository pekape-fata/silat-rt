-- =========================================================
-- SILAT RT — SQL SCHEMA (TAHAP 5)
-- Sistem Informasi Langgar dan RT
-- Target: PostgreSQL 15+ (Supabase)
-- =========================================================

-- ---------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------
create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "pg_trgm";        -- pencarian nama/alamat

-- ---------------------------------------------------------
-- 1. DOMAIN: ROLES, WILAYAH, USERS, LANGGAR, PENGURUS
-- ---------------------------------------------------------

create table public.roles (
    id uuid primary key default gen_random_uuid(),
    nama_role varchar(50) not null unique,
    deskripsi text,
    created_at timestamptz not null default now()
);

create table public.wilayah_rt (
    id uuid primary key default gen_random_uuid(),
    nama_rt varchar(20) not null,
    nama_rw varchar(20) not null,
    kelurahan varchar(100) not null,
    kecamatan varchar(100) not null,
    kota varchar(100) not null,
    provinsi varchar(100) not null,
    created_at timestamptz not null default now(),
    unique (nama_rt, nama_rw, kelurahan)
);

-- users terhubung ke auth.users bawaan Supabase Auth
create table public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    role_id uuid not null references public.roles(id) on delete restrict,
    wilayah_rt_id uuid references public.wilayah_rt(id) on delete set null,
    email varchar(150) not null unique,
    nama_lengkap varchar(150) not null,
    no_wa varchar(20),
    foto_url text,
    aktif boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index idx_users_role on public.users(role_id);
create index idx_users_wilayah on public.users(wilayah_rt_id);

create table public.langgar (
    id uuid primary key default gen_random_uuid(),
    wilayah_rt_id uuid not null references public.wilayah_rt(id) on delete restrict,
    nama_langgar varchar(150) not null,
    alamat text not null,
    latitude decimal(10,7),
    longitude decimal(10,7),
    foto_url text,
    sejarah text,
    visi text,
    misi text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index idx_langgar_wilayah on public.langgar(wilayah_rt_id);

create table public.pengurus_rt (
    id uuid primary key default gen_random_uuid(),
    wilayah_rt_id uuid not null references public.wilayah_rt(id) on delete cascade,
    user_id uuid not null references public.users(id) on delete cascade,
    jabatan varchar(50) not null check (jabatan in ('Ketua RT','Sekretaris RT','Bendahara RT')),
    tanggal_mulai date not null default current_date,
    tanggal_selesai date,
    created_at timestamptz not null default now(),
    unique (wilayah_rt_id, user_id, jabatan, tanggal_mulai)
);

create table public.pengurus_takmir (
    id uuid primary key default gen_random_uuid(),
    langgar_id uuid not null references public.langgar(id) on delete cascade,
    user_id uuid not null references public.users(id) on delete cascade,
    jabatan varchar(50) not null check (jabatan in ('Ketua Takmir','Sekretaris Takmir','Bendahara Takmir','Imam')),
    no_wa varchar(20),
    alamat text,
    tanggal_mulai date not null default current_date,
    tanggal_selesai date,
    created_at timestamptz not null default now(),
    unique (langgar_id, user_id, jabatan, tanggal_mulai)
);
create index idx_pengurus_takmir_langgar on public.pengurus_takmir(langgar_id);
create index idx_pengurus_takmir_user on public.pengurus_takmir(user_id);

-- ---------------------------------------------------------
-- 2. DOMAIN: KEPENDUDUKAN
-- ---------------------------------------------------------

create table public.kartu_keluarga (
    id uuid primary key default gen_random_uuid(),
    wilayah_rt_id uuid not null references public.wilayah_rt(id) on delete restrict,
    no_kk varchar(20) not null unique,
    alamat text not null,
    kepala_keluarga_id uuid,  -- FK ke warga, ditambahkan setelah tabel warga dibuat
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index idx_kk_wilayah on public.kartu_keluarga(wilayah_rt_id);

create table public.warga (
    id uuid primary key default gen_random_uuid(),
    kk_id uuid not null references public.kartu_keluarga(id) on delete restrict,
    nik varchar(16) not null unique,
    nama varchar(150) not null,
    tempat_lahir varchar(100),
    tanggal_lahir date,
    agama varchar(30),
    pendidikan varchar(50),
    pekerjaan varchar(100),
    golongan_darah varchar(5),
    status_kawin varchar(30) check (status_kawin in ('Belum Kawin','Kawin','Cerai Hidup','Cerai Mati')),
    no_hp varchar(20),
    no_wa varchar(20),
    email varchar(150),
    alamat text,
    foto_url text,
    status_domisili varchar(20) not null default 'aktif' check (status_domisili in ('aktif','pindah','meninggal')),
    user_id uuid references public.users(id) on delete set null, -- opsional, jika warga punya akun login
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index idx_warga_kk on public.warga(kk_id);
create index idx_warga_status on public.warga(status_domisili);
create index idx_warga_nama_trgm on public.warga using gin (nama gin_trgm_ops);

alter table public.kartu_keluarga
    add constraint fk_kk_kepala_keluarga
    foreign key (kepala_keluarga_id) references public.warga(id) on delete set null;

create table public.riwayat_warga (
    id uuid primary key default gen_random_uuid(),
    warga_id uuid not null references public.warga(id) on delete cascade,
    jenis_riwayat varchar(20) not null check (jenis_riwayat in ('pindah','mutasi','meninggal')),
    keterangan text,
    tanggal_kejadian date not null,
    dicatat_oleh uuid references public.users(id) on delete set null,
    created_at timestamptz not null default now()
);
create index idx_riwayat_warga_warga on public.riwayat_warga(warga_id);

create table public.qr_identitas (
    id uuid primary key default gen_random_uuid(),
    warga_id uuid not null unique references public.warga(id) on delete cascade,
    kode_qr varchar(100) not null unique,
    generated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 3. DOMAIN: SURAT-MENYURAT
-- ---------------------------------------------------------

create table public.jenis_surat (
    id uuid primary key default gen_random_uuid(),
    nama_jenis varchar(100) not null unique,
    format_nomor varchar(100) not null default '{no}/{jenis}/{rt}/{bulan_romawi}/{tahun}',
    template_konten text,
    butuh_approval boolean not null default true,
    created_at timestamptz not null default now()
);

create table public.tanda_tangan_digital (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    jabatan varchar(50) not null,
    file_ttd_url text not null,
    file_stempel_url text,
    created_at timestamptz not null default now(),
    unique (user_id, jabatan)
);

create table public.surat (
    id uuid primary key default gen_random_uuid(),
    jenis_surat_id uuid not null references public.jenis_surat(id) on delete restrict,
    warga_id uuid not null references public.warga(id) on delete restrict,
    nomor_surat varchar(100) unique,
    isi_surat text,
    status varchar(20) not null default 'diajukan'
        check (status in ('diajukan','diproses','disetujui','ditolak','terbit')),
    diproses_oleh uuid references public.users(id) on delete set null,
    disetujui_oleh uuid references public.users(id) on delete set null,
    catatan_revisi text,
    file_pdf_url text,
    created_at timestamptz not null default now(),
    terbit_at timestamptz
);
create index idx_surat_warga on public.surat(warga_id);
create index idx_surat_status on public.surat(status);
create index idx_surat_jenis on public.surat(jenis_surat_id);

create table public.qr_verifikasi_surat (
    id uuid primary key default gen_random_uuid(),
    surat_id uuid not null unique references public.surat(id) on delete cascade,
    kode_qr varchar(100) not null unique,
    url_verifikasi text not null,
    generated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 4. DOMAIN: KEUANGAN RT & TAKMIR
-- ---------------------------------------------------------

create table public.jenis_iuran (
    id uuid primary key default gen_random_uuid(),
    nama_iuran varchar(50) not null unique,
    nominal_default decimal(12,2) default 0,
    periode varchar(20) check (periode in ('bulanan','insidental')),
    created_at timestamptz not null default now()
);

create table public.transaksi_keuangan_rt (
    id uuid primary key default gen_random_uuid(),
    wilayah_rt_id uuid not null references public.wilayah_rt(id) on delete restrict,
    jenis_iuran_id uuid references public.jenis_iuran(id) on delete restrict,
    kk_id uuid references public.kartu_keluarga(id) on delete set null,
    tipe varchar(15) not null check (tipe in ('pemasukan','pengeluaran')),
    nominal decimal(12,2) not null check (nominal >= 0),
    keterangan text,
    tanggal_transaksi date not null default current_date,
    dicatat_oleh uuid references public.users(id) on delete set null,
    bukti_url text,
    created_at timestamptz not null default now()
);
create index idx_trx_rt_wilayah_tgl on public.transaksi_keuangan_rt(wilayah_rt_id, tanggal_transaksi);
create index idx_trx_rt_jenis on public.transaksi_keuangan_rt(jenis_iuran_id);

create table public.kategori_kas_takmir (
    id uuid primary key default gen_random_uuid(),
    nama_kategori varchar(50) not null unique
);

create table public.transaksi_keuangan_takmir (
    id uuid primary key default gen_random_uuid(),
    langgar_id uuid not null references public.langgar(id) on delete restrict,
    kategori_id uuid references public.kategori_kas_takmir(id) on delete restrict,
    tipe varchar(15) not null check (tipe in ('pemasukan','pengeluaran')),
    nominal decimal(12,2) not null check (nominal >= 0),
    keterangan text,
    tanggal_transaksi date not null default current_date,
    dicatat_oleh uuid references public.users(id) on delete set null,
    bukti_url text,
    created_at timestamptz not null default now()
);
create index idx_trx_takmir_langgar_tgl on public.transaksi_keuangan_takmir(langgar_id, tanggal_transaksi);

-- ---------------------------------------------------------
-- 5. DOMAIN: TAKMIR OPERASIONAL
-- ---------------------------------------------------------

create table public.jadwal_imam (
    id uuid primary key default gen_random_uuid(),
    langgar_id uuid not null references public.langgar(id) on delete cascade,
    pengurus_takmir_id uuid not null references public.pengurus_takmir(id) on delete cascade,
    waktu_sholat varchar(10) not null check (waktu_sholat in ('subuh','dzuhur','ashar','maghrib','isya')),
    pola_ulang varchar(20) not null default 'mingguan' check (pola_ulang in ('harian','mingguan','custom')),
    tanggal_mulai date not null,
    tanggal_selesai date,
    created_at timestamptz not null default now()
);
create index idx_jadwal_imam_langgar on public.jadwal_imam(langgar_id);

create table public.jadwal_sholat_cache (
    id uuid primary key default gen_random_uuid(),
    langgar_id uuid not null references public.langgar(id) on delete cascade,
    tanggal date not null,
    subuh time,
    dzuhur time,
    ashar time,
    maghrib time,
    isya time,
    sumber_data varchar(50) default 'aladhan_api',
    cached_at timestamptz not null default now(),
    unique (langgar_id, tanggal)
);

create table public.inventaris (
    id uuid primary key default gen_random_uuid(),
    langgar_id uuid not null references public.langgar(id) on delete cascade,
    nama_barang varchar(100) not null,
    jumlah int not null default 1,
    kondisi varchar(30) check (kondisi in ('baik','rusak','perlu perbaikan')),
    keterangan text,
    created_at timestamptz not null default now()
);
create index idx_inventaris_langgar on public.inventaris(langgar_id);

create table public.surat_undangan (
    id uuid primary key default gen_random_uuid(),
    langgar_id uuid not null references public.langgar(id) on delete cascade,
    judul_acara varchar(150) not null,
    isi_undangan text,
    tanggal_acara date not null,
    dibuat_oleh uuid references public.users(id) on delete set null,
    status varchar(15) not null default 'draft' check (status in ('draft','terkirim')),
    created_at timestamptz not null default now()
);

create table public.undangan_penerima (
    id uuid primary key default gen_random_uuid(),
    undangan_id uuid not null references public.surat_undangan(id) on delete cascade,
    warga_id uuid not null references public.warga(id) on delete cascade,
    status_kirim varchar(15) not null default 'belum' check (status_kirim in ('belum','terkirim')),
    unique (undangan_id, warga_id)
);

create table public.qr_verifikasi_undangan (
    id uuid primary key default gen_random_uuid(),
    undangan_id uuid not null unique references public.surat_undangan(id) on delete cascade,
    kode_qr varchar(100) not null unique
);

-- ---------------------------------------------------------
-- 6. DOMAIN: AGENDA, PENGUMUMAN, ADMIN & LOG
-- ---------------------------------------------------------

create table public.agenda (
    id uuid primary key default gen_random_uuid(),
    wilayah_rt_id uuid references public.wilayah_rt(id) on delete cascade,
    langgar_id uuid references public.langgar(id) on delete cascade,
    judul varchar(150) not null,
    deskripsi text,
    tanggal_mulai timestamptz not null,
    tanggal_selesai timestamptz,
    lokasi varchar(200),
    dibuat_oleh uuid references public.users(id) on delete set null,
    created_at timestamptz not null default now(),
    check (wilayah_rt_id is not null or langgar_id is not null)
);
create index idx_agenda_wilayah on public.agenda(wilayah_rt_id);
create index idx_agenda_langgar on public.agenda(langgar_id);

create table public.pengumuman (
    id uuid primary key default gen_random_uuid(),
    judul varchar(150) not null,
    isi text not null,
    target_grup varchar(30) not null
        check (target_grup in ('semua_warga','pengurus_rt','pengurus_takmir','jamaah_tertentu')),
    dibuat_oleh uuid references public.users(id) on delete set null,
    created_at timestamptz not null default now()
);

create table public.pengumuman_target (
    id uuid primary key default gen_random_uuid(),
    pengumuman_id uuid not null references public.pengumuman(id) on delete cascade,
    user_id uuid references public.users(id) on delete cascade
);
create index idx_pengumuman_target_pengumuman on public.pengumuman_target(pengumuman_id);

create table public.log_aktivitas (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.users(id) on delete set null,
    aksi varchar(100) not null,
    modul varchar(50) not null,
    detail text,
    ip_address varchar(45),
    created_at timestamptz not null default now()
);
create index idx_log_user_created on public.log_aktivitas(user_id, created_at);

create table public.backup_database (
    id uuid primary key default gen_random_uuid(),
    dilakukan_oleh uuid references public.users(id) on delete set null,
    jenis varchar(15) not null check (jenis in ('backup','restore')),
    file_url text,
    status varchar(20) not null default 'proses' check (status in ('proses','berhasil','gagal')),
    created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 7. TRIGGER: updated_at otomatis
-- ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger trg_users_updated before update on public.users
    for each row execute function public.set_updated_at();
create trigger trg_langgar_updated before update on public.langgar
    for each row execute function public.set_updated_at();
create trigger trg_kk_updated before update on public.kartu_keluarga
    for each row execute function public.set_updated_at();
create trigger trg_warga_updated before update on public.warga
    for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- 8. SEED DATA DASAR (ROLES, JENIS SURAT, JENIS IURAN)
-- ---------------------------------------------------------
insert into public.roles (nama_role, deskripsi) values
    ('Administrator', 'Akses penuh seluruh sistem'),
    ('Ketua RT', 'Pimpinan RT, approve surat & pengumuman'),
    ('Sekretaris RT', 'Kelola data warga & surat'),
    ('Bendahara RT', 'Kelola keuangan RT'),
    ('Ketua Takmir', 'Pimpinan takmir langgar'),
    ('Sekretaris Takmir', 'Kelola jadwal & undangan takmir'),
    ('Bendahara Takmir', 'Kelola keuangan takmir'),
    ('Imam', 'Petugas imam sholat'),
    ('Operator', 'Input data operasional terbatas'),
    ('Warga', 'Anggota masyarakat RT');

insert into public.jenis_surat (nama_jenis, butuh_approval) values
    ('Surat Pengantar KTP', true),
    ('Surat Pengantar KK', true),
    ('Surat Pengantar SKCK', true),
    ('Surat Pengantar Nikah', true),
    ('Surat Pengantar Cerai', true),
    ('Surat Pengantar Akta Lahir', true),
    ('Surat Pengantar Akta Mati', true),
    ('Surat Keterangan Domisili', true),
    ('Surat Keterangan Usaha', true),
    ('Surat Keterangan Tidak Mampu', true),
    ('Surat Keterangan Beasiswa', true),
    ('Surat Keterangan Kehilangan', false),
    ('Surat Keterangan Pindah', true),
    ('Surat Keterangan Pendatang', true);

insert into public.jenis_iuran (nama_iuran, periode) values
    ('Kas', 'bulanan'),
    ('Sampah', 'bulanan'),
    ('Keamanan', 'bulanan'),
    ('Jimpitan', 'bulanan'),
    ('Arisan', 'bulanan'),
    ('Pembangunan', 'insidental'),
    ('Air', 'bulanan'),
    ('Lainnya', 'insidental');
