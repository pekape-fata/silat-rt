-- =========================================================
-- SILAT RT — AUTH TRIGGER, STORAGE, REALTIME (TAHAP 5)
-- Dijalankan SETELAH 05a-schema-SILAT-RT.sql dan 05b-rls-policies-SILAT-RT.sql
-- =========================================================

-- ---------------------------------------------------------
-- 1. TRIGGER: OTOMATIS BUAT BARIS public.users SAAT REGISTER
--    (role default = 'Warga', bisa diubah admin setelahnya)
-- ---------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
as $$
declare
    default_role_id uuid;
begin
    select id into default_role_id from public.roles where nama_role = 'Warga';

    insert into public.users (id, role_id, email, nama_lengkap)
    values (
        new.id,
        default_role_id,
        new.email,
        coalesce(new.raw_user_meta_data ->> 'nama_lengkap', new.email)
    );
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------
-- 2. STORAGE BUCKETS
-- ---------------------------------------------------------
-- foto-warga        : foto profil warga (privat, hanya bisa dilihat sesuai RLS)
-- foto-langgar       : foto profil langgar (publik)
-- surat-pdf          : hasil surat PDF (privat + akses via signed URL/QR)
-- ttd-stempel        : file tanda tangan & stempel digital (privat, admin/pemilik saja)
-- bukti-transaksi    : bukti nota pemasukan/pengeluaran (privat)
-- backup-database    : hasil backup database (privat, admin only)

insert into storage.buckets (id, name, public)
values
    ('foto-warga', 'foto-warga', false),
    ('foto-langgar', 'foto-langgar', true),
    ('surat-pdf', 'surat-pdf', false),
    ('ttd-stempel', 'ttd-stempel', false),
    ('bukti-transaksi', 'bukti-transaksi', false),
    ('backup-database', 'backup-database', false)
on conflict (id) do nothing;

-- Contoh policy storage: foto-langgar bisa dibaca siapa saja (publik)
create policy "foto_langgar_public_read"
    on storage.objects for select
    using (bucket_id = 'foto-langgar');

-- Contoh policy storage: hanya pengguna login yang bisa upload foto warga
create policy "foto_warga_authenticated_upload"
    on storage.objects for insert
    with check (bucket_id = 'foto-warga' and auth.role() = 'authenticated');

create policy "foto_warga_authenticated_read"
    on storage.objects for select
    using (bucket_id = 'foto-warga' and auth.role() = 'authenticated');

-- Backup database: admin only
create policy "backup_admin_only_storage"
    on storage.objects for all
    using (bucket_id = 'backup-database' and public.is_admin())
    with check (bucket_id = 'backup-database' and public.is_admin());

-- ---------------------------------------------------------
-- 3. REALTIME PUBLICATION
--    Tabel yang perlu update realtime ke dashboard/pengguna aktif
-- ---------------------------------------------------------
alter publication supabase_realtime add table public.transaksi_keuangan_rt;
alter publication supabase_realtime add table public.transaksi_keuangan_takmir;
alter publication supabase_realtime add table public.pengumuman;
alter publication supabase_realtime add table public.agenda;
alter publication supabase_realtime add table public.surat;
alter publication supabase_realtime add table public.jadwal_imam;

-- Catatan: aktifkan "Realtime" per tabel juga lewat Supabase Dashboard
-- (Database > Replication) jika publication belum otomatis ter-enable.
