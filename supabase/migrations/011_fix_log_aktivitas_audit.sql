-- =========================================================
-- SILAT RT — 011_fix_log_aktivitas_audit.sql
-- Dijalankan SETELAH 010_fix_riwayat_warga_rls.sql
--
-- BUG YANG DIPERBAIKI:
-- Policy "log_system_insert" (002_rls_policies.sql, baris ~363)
-- mengizinkan SEMUA user yang login (auth.role() = 'authenticated')
-- untuk INSERT bebas ke tabel log_aktivitas, termasuk kolom
-- user_id yang dikirim dari client. Artinya siapa pun yang login
-- bisa menyisipkan entri log palsu (mis. seolah tindakan dilakukan
-- oleh orang lain) untuk menutupi jejak penyalahgunaan.
--
-- Catatan: per pengecekan kode (src/), tabel log_aktivitas belum
-- dipakai di halaman manapun saat ini — jadi ini menutup celah
-- laten sebelum fitur audit log benar-benar dipakai di aplikasi.
--
-- Skema asli (001_schema.sql, baris ~357):
--   id, user_id, aksi varchar(100), modul varchar(50),
--   detail text, ip_address varchar(45), created_at
--
-- PERBAIKAN:
-- 1. Cabut hak INSERT langsung dari client biasa; hanya admin yang
--    boleh insert manual (mis. untuk keperluan debug/darurat).
-- 2. Sediakan fungsi SECURITY DEFINER "catat_log_aktivitas" sebagai
--    satu-satunya jalur resmi mencatat log dari aplikasi — user_id
--    dan waktu diambil otomatis dari server (auth.uid(), now()),
--    tidak bisa dipalsukan dari client.
-- 3. Trigger otomatis untuk mencatat perubahan status pada tabel
--    surat, supaya pencatatan tidak bergantung kode frontend
--    memanggil fungsi dengan benar.
-- =========================================================

-- 1. Cabut hak insert bebas dari authenticated
drop policy if exists "log_system_insert" on public.log_aktivitas;

drop policy if exists "log_admin_insert" on public.log_aktivitas;
create policy "log_admin_insert" on public.log_aktivitas for insert
    with check (public.is_admin());

-- 2. Fungsi resmi untuk mencatat log (user_id & waktu dari server, bukan dari client)
create or replace function public.catat_log_aktivitas(
    p_aksi text,
    p_modul text,
    p_detail text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.log_aktivitas (user_id, aksi, modul, detail, created_at)
    values (auth.uid(), p_aksi, p_modul, p_detail, now());
end;
$$;

grant execute on function public.catat_log_aktivitas(text, text, text) to authenticated;

-- 3. Trigger otomatis untuk perubahan status surat (tidak bisa dilewati kode frontend)
create or replace function public.trigger_log_perubahan_surat()
returns trigger
language plpgsql
security definer
as $$
begin
    if old.status is distinct from new.status then
        insert into public.log_aktivitas (user_id, aksi, modul, detail, created_at)
        values (
            auth.uid(),
            'ubah_status_surat',
            'surat',
            format('Surat %s: status berubah dari %s ke %s', new.id, old.status, new.status),
            now()
        );
    end if;
    return new;
end;
$$;

drop trigger if exists trg_log_surat on public.surat;

create trigger trg_log_surat
after update on public.surat
for each row execute function public.trigger_log_perubahan_surat();

-- =========================================================
-- TINDAK LANJUT DI KODE APLIKASI (opsional, untuk log manual lain
-- di luar perubahan status surat — mis. saat admin menghapus data):
--
--   await supabase.rpc('catat_log_aktivitas', {
--     p_aksi: 'hapus_warga',
--     p_modul: 'warga',
--     p_detail: `Menghapus data warga ${namaWarga}`
--   });
--
-- VERIFIKASI:
-- 1. Login sebagai warga/pengurus biasa (bukan admin).
-- 2. Coba: insert into log_aktivitas (user_id, aksi, modul)
--    values (auth.uid(), 'test', 'test');
--    -> Harus DITOLAK oleh RLS.
-- 3. Ubah status sebuah baris di tabel surat lewat aplikasi seperti
--    biasa -> cek tabel log_aktivitas, harus muncul baris baru
--    otomatis dari trigger.
-- =========================================================
