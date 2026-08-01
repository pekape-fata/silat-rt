-- =========================================================
-- SILAT RT — ROW LEVEL SECURITY POLICIES (TAHAP 5)
-- Dijalankan SETELAH 05a-schema-SILAT-RT.sql
-- =========================================================

-- ---------------------------------------------------------
-- 0. HELPER FUNCTIONS (dipakai berulang di semua policy)
-- ---------------------------------------------------------

-- Nama role pengguna yang sedang login
create or replace function public.current_role_name()
returns text
language sql
security definer
stable
as $$
    select r.nama_role
    from public.users u
    join public.roles r on r.id = u.role_id
    where u.id = auth.uid()
$$;

-- Wilayah RT milik pengguna yang sedang login
create or replace function public.current_wilayah_rt_id()
returns uuid
language sql
security definer
stable
as $$
    select wilayah_rt_id from public.users where id = auth.uid()
$$;

-- Daftar langgar_id di mana pengguna adalah pengurus takmir aktif
create or replace function public.current_langgar_ids()
returns setof uuid
language sql
security definer
stable
as $$
    select langgar_id from public.pengurus_takmir
    where user_id = auth.uid()
      and (tanggal_selesai is null or tanggal_selesai >= current_date)
$$;

-- Apakah pengguna adalah Administrator
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
    select public.current_role_name() = 'Administrator'
$$;

-- warga_id milik pengguna yang login (jika akun Warga terhubung ke data warga)
create or replace function public.current_warga_id()
returns uuid
language sql
security definer
stable
as $$
    select id from public.warga where user_id = auth.uid()
$$;

-- ---------------------------------------------------------
-- 1. AKTIFKAN RLS DI SEMUA TABEL
-- ---------------------------------------------------------
alter table public.roles enable row level security;
alter table public.wilayah_rt enable row level security;
alter table public.users enable row level security;
alter table public.langgar enable row level security;
alter table public.pengurus_rt enable row level security;
alter table public.pengurus_takmir enable row level security;
alter table public.kartu_keluarga enable row level security;
alter table public.warga enable row level security;
alter table public.riwayat_warga enable row level security;
alter table public.qr_identitas enable row level security;
alter table public.jenis_surat enable row level security;
alter table public.tanda_tangan_digital enable row level security;
alter table public.surat enable row level security;
alter table public.qr_verifikasi_surat enable row level security;
alter table public.jenis_iuran enable row level security;
alter table public.transaksi_keuangan_rt enable row level security;
alter table public.kategori_kas_takmir enable row level security;
alter table public.transaksi_keuangan_takmir enable row level security;
alter table public.jadwal_imam enable row level security;
alter table public.jadwal_sholat_cache enable row level security;
alter table public.inventaris enable row level security;
alter table public.surat_undangan enable row level security;
alter table public.undangan_penerima enable row level security;
alter table public.qr_verifikasi_undangan enable row level security;
alter table public.agenda enable row level security;
alter table public.pengumuman enable row level security;
alter table public.pengumuman_target enable row level security;
alter table public.log_aktivitas enable row level security;
alter table public.backup_database enable row level security;

-- ---------------------------------------------------------
-- 2. POLICY: ROLES & JENIS_SURAT & JENIS_IURAN & KATEGORI_KAS_TAKMIR
--    (tabel referensi — semua yang login boleh baca, hanya admin boleh ubah)
-- ---------------------------------------------------------
drop policy if exists "ref_select_authenticated" on public.roles;
create policy "ref_select_authenticated" on public.roles for select using (auth.role() = 'authenticated');
drop policy if exists "ref_admin_write" on public.roles;
create policy "ref_admin_write" on public.roles for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "jenis_surat_select_authenticated" on public.jenis_surat;
create policy "jenis_surat_select_authenticated" on public.jenis_surat for select using (auth.role() = 'authenticated');
drop policy if exists "jenis_surat_admin_write" on public.jenis_surat;
create policy "jenis_surat_admin_write" on public.jenis_surat for insert with check (public.is_admin());
drop policy if exists "jenis_surat_admin_update" on public.jenis_surat;
create policy "jenis_surat_admin_update" on public.jenis_surat for update using (public.is_admin());
drop policy if exists "jenis_surat_admin_delete" on public.jenis_surat;
create policy "jenis_surat_admin_delete" on public.jenis_surat for delete using (public.is_admin());

drop policy if exists "jenis_iuran_select_authenticated" on public.jenis_iuran;
create policy "jenis_iuran_select_authenticated" on public.jenis_iuran for select using (auth.role() = 'authenticated');
drop policy if exists "jenis_iuran_admin_write" on public.jenis_iuran;
create policy "jenis_iuran_admin_write" on public.jenis_iuran for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "kategori_takmir_select_authenticated" on public.kategori_kas_takmir;
create policy "kategori_takmir_select_authenticated" on public.kategori_kas_takmir for select using (auth.role() = 'authenticated');
drop policy if exists "kategori_takmir_admin_write" on public.kategori_kas_takmir;
create policy "kategori_takmir_admin_write" on public.kategori_kas_takmir for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------
-- 3. POLICY: WILAYAH_RT & LANGGAR
-- ---------------------------------------------------------
drop policy if exists "wilayah_select_authenticated" on public.wilayah_rt;
create policy "wilayah_select_authenticated" on public.wilayah_rt for select using (auth.role() = 'authenticated');
drop policy if exists "wilayah_admin_write" on public.wilayah_rt;
create policy "wilayah_admin_write" on public.wilayah_rt for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "langgar_select_authenticated" on public.langgar;
create policy "langgar_select_authenticated" on public.langgar for select using (auth.role() = 'authenticated');
drop policy if exists "langgar_write_admin_or_ketua_takmir" on public.langgar;
create policy "langgar_write_admin_or_ketua_takmir" on public.langgar for update
    using (public.is_admin() or id in (select * from public.current_langgar_ids()))
    with check (public.is_admin() or id in (select * from public.current_langgar_ids()));
drop policy if exists "langgar_insert_admin" on public.langgar;
create policy "langgar_insert_admin" on public.langgar for insert with check (public.is_admin());

-- ---------------------------------------------------------
-- 4. POLICY: USERS
-- ---------------------------------------------------------
drop policy if exists "users_select_self_or_admin" on public.users;
create policy "users_select_self_or_admin" on public.users for select
    using (id = auth.uid() or public.is_admin() or public.current_role_name() like '%RT' or public.current_role_name() like '%Takmir');
drop policy if exists "users_update_self" on public.users;
create policy "users_update_self" on public.users for update
    using (id = auth.uid() or public.is_admin())
    with check (id = auth.uid() or public.is_admin());
drop policy if exists "users_admin_insert" on public.users;
create policy "users_admin_insert" on public.users for insert with check (public.is_admin());
drop policy if exists "users_admin_delete" on public.users;
create policy "users_admin_delete" on public.users for delete using (public.is_admin());

-- ---------------------------------------------------------
-- 5. POLICY: PENGURUS_RT & PENGURUS_TAKMIR
-- ---------------------------------------------------------
drop policy if exists "pengurus_rt_select_authenticated" on public.pengurus_rt;
create policy "pengurus_rt_select_authenticated" on public.pengurus_rt for select using (auth.role() = 'authenticated');
drop policy if exists "pengurus_rt_write" on public.pengurus_rt;
create policy "pengurus_rt_write" on public.pengurus_rt for all
    using (public.is_admin() or (public.current_role_name() = 'Ketua RT' and wilayah_rt_id = public.current_wilayah_rt_id()))
    with check (public.is_admin() or (public.current_role_name() = 'Ketua RT' and wilayah_rt_id = public.current_wilayah_rt_id()));

drop policy if exists "pengurus_takmir_select_authenticated" on public.pengurus_takmir;
create policy "pengurus_takmir_select_authenticated" on public.pengurus_takmir for select using (auth.role() = 'authenticated');
drop policy if exists "pengurus_takmir_write" on public.pengurus_takmir;
create policy "pengurus_takmir_write" on public.pengurus_takmir for all
    using (public.is_admin() or langgar_id in (select * from public.current_langgar_ids()))
    with check (public.is_admin() or langgar_id in (select * from public.current_langgar_ids()));

-- ---------------------------------------------------------
-- 6. POLICY: KARTU_KELUARGA & WARGA & RIWAYAT_WARGA & QR_IDENTITAS
-- ---------------------------------------------------------
drop policy if exists "kk_select_rt_scope" on public.kartu_keluarga;
create policy "kk_select_rt_scope" on public.kartu_keluarga for select
    using (public.is_admin()
        or wilayah_rt_id = public.current_wilayah_rt_id()
        or id = (select kk_id from public.warga where id = public.current_warga_id()));
drop policy if exists "kk_write_rt_pengurus" on public.kartu_keluarga;
create policy "kk_write_rt_pengurus" on public.kartu_keluarga for all
    using (public.is_admin() or (public.current_role_name() in ('Ketua RT','Sekretaris RT') and wilayah_rt_id = public.current_wilayah_rt_id()))
    with check (public.is_admin() or (public.current_role_name() in ('Ketua RT','Sekretaris RT') and wilayah_rt_id = public.current_wilayah_rt_id()));

drop policy if exists "warga_select_scope" on public.warga;
create policy "warga_select_scope" on public.warga for select
    using (public.is_admin()
        or id = public.current_warga_id()
        or kk_id in (select id from public.kartu_keluarga where wilayah_rt_id = public.current_wilayah_rt_id()));
drop policy if exists "warga_write_rt_pengurus" on public.warga;
create policy "warga_write_rt_pengurus" on public.warga for insert
    with check (public.is_admin() or public.current_role_name() in ('Ketua RT','Sekretaris RT'));
drop policy if exists "warga_update_rt_pengurus" on public.warga;
create policy "warga_update_rt_pengurus" on public.warga for update
    using (public.is_admin() or public.current_role_name() in ('Ketua RT','Sekretaris RT'))
    with check (public.is_admin() or public.current_role_name() in ('Ketua RT','Sekretaris RT'));

drop policy if exists "riwayat_warga_select_scope" on public.riwayat_warga;
create policy "riwayat_warga_select_scope" on public.riwayat_warga for select
    using (public.is_admin() or warga_id in (select id from public.warga));
drop policy if exists "riwayat_warga_write_rt_pengurus" on public.riwayat_warga;
create policy "riwayat_warga_write_rt_pengurus" on public.riwayat_warga for insert
    with check (public.is_admin() or public.current_role_name() in ('Ketua RT','Sekretaris RT'));

drop policy if exists "qr_identitas_select_scope" on public.qr_identitas;
create policy "qr_identitas_select_scope" on public.qr_identitas for select
    using (public.is_admin() or warga_id = public.current_warga_id() or public.current_role_name() in ('Ketua RT','Sekretaris RT'));
drop policy if exists "qr_identitas_insert_rt" on public.qr_identitas;
create policy "qr_identitas_insert_rt" on public.qr_identitas for insert
    with check (public.is_admin() or public.current_role_name() in ('Ketua RT','Sekretaris RT'));

-- ---------------------------------------------------------
-- 7. POLICY: TANDA_TANGAN_DIGITAL
-- ---------------------------------------------------------
drop policy if exists "ttd_select_scope" on public.tanda_tangan_digital;
create policy "ttd_select_scope" on public.tanda_tangan_digital for select
    using (public.is_admin() or user_id = auth.uid() or public.current_role_name() in ('Sekretaris RT','Sekretaris Takmir'));
drop policy if exists "ttd_write_self_or_admin" on public.tanda_tangan_digital;
create policy "ttd_write_self_or_admin" on public.tanda_tangan_digital for all
    using (public.is_admin() or user_id = auth.uid())
    with check (public.is_admin() or user_id = auth.uid());

-- ---------------------------------------------------------
-- 8. POLICY: SURAT & QR_VERIFIKASI_SURAT
-- ---------------------------------------------------------
drop policy if exists "surat_select_scope" on public.surat;
create policy "surat_select_scope" on public.surat for select
    using (public.is_admin()
        or warga_id = public.current_warga_id()
        or public.current_role_name() in ('Ketua RT','Sekretaris RT'));
drop policy if exists "surat_insert_scope" on public.surat;
create policy "surat_insert_scope" on public.surat for insert
    with check (public.is_admin()
        or warga_id = public.current_warga_id()
        or public.current_role_name() in ('Ketua RT','Sekretaris RT'));
drop policy if exists "surat_update_pengurus" on public.surat;
create policy "surat_update_pengurus" on public.surat for update
    using (public.is_admin() or public.current_role_name() in ('Ketua RT','Sekretaris RT'))
    with check (public.is_admin() or public.current_role_name() in ('Ketua RT','Sekretaris RT'));

-- QR verification bersifat publik (dipindai warga/pihak luar) — hanya baca, tanpa auth wajib
drop policy if exists "qr_verifikasi_surat_public_select" on public.qr_verifikasi_surat;
create policy "qr_verifikasi_surat_public_select" on public.qr_verifikasi_surat for select using (true);
drop policy if exists "qr_verifikasi_surat_insert_pengurus" on public.qr_verifikasi_surat;
create policy "qr_verifikasi_surat_insert_pengurus" on public.qr_verifikasi_surat for insert
    with check (public.is_admin() or public.current_role_name() in ('Ketua RT','Sekretaris RT'));

-- ---------------------------------------------------------
-- 9. POLICY: TRANSAKSI_KEUANGAN_RT
-- ---------------------------------------------------------
drop policy if exists "trx_rt_select_scope" on public.transaksi_keuangan_rt;
create policy "trx_rt_select_scope" on public.transaksi_keuangan_rt for select
    using (public.is_admin()
        or wilayah_rt_id = public.current_wilayah_rt_id()
        or kk_id = (select kk_id from public.warga where id = public.current_warga_id()));
drop policy if exists "trx_rt_write_bendahara" on public.transaksi_keuangan_rt;
create policy "trx_rt_write_bendahara" on public.transaksi_keuangan_rt for insert
    with check (public.is_admin() or (public.current_role_name() = 'Bendahara RT' and wilayah_rt_id = public.current_wilayah_rt_id()));
drop policy if exists "trx_rt_update_bendahara" on public.transaksi_keuangan_rt;
create policy "trx_rt_update_bendahara" on public.transaksi_keuangan_rt for update
    using (public.is_admin() or (public.current_role_name() = 'Bendahara RT' and wilayah_rt_id = public.current_wilayah_rt_id()))
    with check (public.is_admin() or (public.current_role_name() = 'Bendahara RT' and wilayah_rt_id = public.current_wilayah_rt_id()));

-- ---------------------------------------------------------
-- 10. POLICY: TRANSAKSI_KEUANGAN_TAKMIR
-- ---------------------------------------------------------
drop policy if exists "trx_takmir_select_scope" on public.transaksi_keuangan_takmir;
create policy "trx_takmir_select_scope" on public.transaksi_keuangan_takmir for select
    using (public.is_admin() or langgar_id in (select * from public.current_langgar_ids()) or auth.role() = 'authenticated');
drop policy if exists "trx_takmir_write_bendahara" on public.transaksi_keuangan_takmir;
create policy "trx_takmir_write_bendahara" on public.transaksi_keuangan_takmir for insert
    with check (public.is_admin() or (public.current_role_name() = 'Bendahara Takmir' and langgar_id in (select * from public.current_langgar_ids())));
drop policy if exists "trx_takmir_update_bendahara" on public.transaksi_keuangan_takmir;
create policy "trx_takmir_update_bendahara" on public.transaksi_keuangan_takmir for update
    using (public.is_admin() or (public.current_role_name() = 'Bendahara Takmir' and langgar_id in (select * from public.current_langgar_ids())))
    with check (public.is_admin() or (public.current_role_name() = 'Bendahara Takmir' and langgar_id in (select * from public.current_langgar_ids())));

-- ---------------------------------------------------------
-- 11. POLICY: JADWAL_IMAM, JADWAL_SHOLAT_CACHE, INVENTARIS
-- ---------------------------------------------------------
drop policy if exists "jadwal_imam_select_authenticated" on public.jadwal_imam;
create policy "jadwal_imam_select_authenticated" on public.jadwal_imam for select using (auth.role() = 'authenticated');
drop policy if exists "jadwal_imam_write_sekretaris_takmir" on public.jadwal_imam;
create policy "jadwal_imam_write_sekretaris_takmir" on public.jadwal_imam for all
    using (public.is_admin() or (public.current_role_name() = 'Sekretaris Takmir' and langgar_id in (select * from public.current_langgar_ids())))
    with check (public.is_admin() or (public.current_role_name() = 'Sekretaris Takmir' and langgar_id in (select * from public.current_langgar_ids())));

drop policy if exists "jadwal_sholat_public_select" on public.jadwal_sholat_cache;
create policy "jadwal_sholat_public_select" on public.jadwal_sholat_cache for select using (true);
drop policy if exists "jadwal_sholat_system_write" on public.jadwal_sholat_cache;
create policy "jadwal_sholat_system_write" on public.jadwal_sholat_cache for all
    using (public.is_admin() or public.current_role_name() = 'Sekretaris Takmir')
    with check (public.is_admin() or public.current_role_name() = 'Sekretaris Takmir');

drop policy if exists "inventaris_select_authenticated" on public.inventaris;
create policy "inventaris_select_authenticated" on public.inventaris for select using (auth.role() = 'authenticated');
drop policy if exists "inventaris_write_takmir" on public.inventaris;
create policy "inventaris_write_takmir" on public.inventaris for all
    using (public.is_admin() or langgar_id in (select * from public.current_langgar_ids()))
    with check (public.is_admin() or langgar_id in (select * from public.current_langgar_ids()));

-- ---------------------------------------------------------
-- 12. POLICY: SURAT_UNDANGAN, UNDANGAN_PENERIMA, QR_VERIFIKASI_UNDANGAN
-- ---------------------------------------------------------
drop policy if exists "undangan_select_scope" on public.surat_undangan;
create policy "undangan_select_scope" on public.surat_undangan for select
    using (public.is_admin() or langgar_id in (select * from public.current_langgar_ids()) or auth.role() = 'authenticated');
drop policy if exists "undangan_write_sekretaris_takmir" on public.surat_undangan;
create policy "undangan_write_sekretaris_takmir" on public.surat_undangan for all
    using (public.is_admin() or (public.current_role_name() in ('Sekretaris Takmir','Ketua Takmir') and langgar_id in (select * from public.current_langgar_ids())))
    with check (public.is_admin() or (public.current_role_name() in ('Sekretaris Takmir','Ketua Takmir') and langgar_id in (select * from public.current_langgar_ids())));

drop policy if exists "undangan_penerima_select_scope" on public.undangan_penerima;
create policy "undangan_penerima_select_scope" on public.undangan_penerima for select
    using (public.is_admin() or warga_id = public.current_warga_id() or auth.role() = 'authenticated');
drop policy if exists "undangan_penerima_write_takmir" on public.undangan_penerima;
create policy "undangan_penerima_write_takmir" on public.undangan_penerima for all
    using (public.is_admin() or public.current_role_name() in ('Sekretaris Takmir','Ketua Takmir'))
    with check (public.is_admin() or public.current_role_name() in ('Sekretaris Takmir','Ketua Takmir'));

drop policy if exists "qr_undangan_public_select" on public.qr_verifikasi_undangan;
create policy "qr_undangan_public_select" on public.qr_verifikasi_undangan for select using (true);
drop policy if exists "qr_undangan_insert_takmir" on public.qr_verifikasi_undangan;
create policy "qr_undangan_insert_takmir" on public.qr_verifikasi_undangan for insert
    with check (public.is_admin() or public.current_role_name() in ('Sekretaris Takmir','Ketua Takmir'));

-- ---------------------------------------------------------
-- 13. POLICY: AGENDA, PENGUMUMAN, PENGUMUMAN_TARGET
-- ---------------------------------------------------------
drop policy if exists "agenda_select_authenticated" on public.agenda;
create policy "agenda_select_authenticated" on public.agenda for select using (auth.role() = 'authenticated');
drop policy if exists "agenda_write_pengurus" on public.agenda;
create policy "agenda_write_pengurus" on public.agenda for all
    using (public.is_admin()
        or (wilayah_rt_id = public.current_wilayah_rt_id() and public.current_role_name() in ('Ketua RT','Sekretaris RT'))
        or (langgar_id in (select * from public.current_langgar_ids())))
    with check (public.is_admin()
        or (wilayah_rt_id = public.current_wilayah_rt_id() and public.current_role_name() in ('Ketua RT','Sekretaris RT'))
        or (langgar_id in (select * from public.current_langgar_ids())));

drop policy if exists "pengumuman_select_authenticated" on public.pengumuman;
create policy "pengumuman_select_authenticated" on public.pengumuman for select using (auth.role() = 'authenticated');
drop policy if exists "pengumuman_write_pengurus" on public.pengumuman;
create policy "pengumuman_write_pengurus" on public.pengumuman for insert
    with check (public.is_admin() or public.current_role_name() like '%RT' or public.current_role_name() like '%Takmir');

drop policy if exists "pengumuman_target_select_scope" on public.pengumuman_target;
create policy "pengumuman_target_select_scope" on public.pengumuman_target for select
    using (public.is_admin() or user_id = auth.uid() or user_id is null);
drop policy if exists "pengumuman_target_write_pengurus" on public.pengumuman_target;
create policy "pengumuman_target_write_pengurus" on public.pengumuman_target for insert
    with check (public.is_admin() or public.current_role_name() like '%RT' or public.current_role_name() like '%Takmir');

-- ---------------------------------------------------------
-- 14. POLICY: LOG_AKTIVITAS & BACKUP_DATABASE (ADMIN ONLY)
-- ---------------------------------------------------------
drop policy if exists "log_admin_select" on public.log_aktivitas;
create policy "log_admin_select" on public.log_aktivitas for select using (public.is_admin());
drop policy if exists "log_system_insert" on public.log_aktivitas;
create policy "log_system_insert" on public.log_aktivitas for insert with check (auth.role() = 'authenticated');

drop policy if exists "backup_admin_only" on public.backup_database;
create policy "backup_admin_only" on public.backup_database for all using (public.is_admin()) with check (public.is_admin());

-- =========================================================
-- CATATAN:
-- 1. Semua policy write (insert/update/delete) tetap divalidasi ulang
--    di level aplikasi (frontend + Postgres function) untuk pesan error
--    yang lebih ramah pengguna sebelum RLS menolak query.
-- 2. Kolom user_id pada tabel users WAJIB sama dengan id auth.users
--    (di-set otomatis lewat trigger on auth.users insert, lihat 05c).
-- =========================================================
