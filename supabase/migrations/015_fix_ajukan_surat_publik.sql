-- =========================================================
-- SILAT RT — 015_fix_ajukan_surat_publik.sql
--
-- BUG: "new row violates row-level security policy for table surat"
--
-- PENYEBAB: src/pages/surat/ajukan-surat-publik.js melakukan 2
-- langkah terpisah sebagai role anon:
--   1. INSERT surat dengan status 'draf_publik'  -> LOLOS (policy
--      "surat_public_insert" mengizinkan ini)
--   2. UPDATE status jadi 'menunggu_verifikasi'   -> DITOLAK, karena
--      tidak ada policy UPDATE apa pun yang mengizinkan role anon
--      (yang ada hanya untuk Ketua RT/Sekretaris RT/RW).
--
-- PERBAIKAN: ganti alur 2-langkah itu dengan SATU pemanggilan fungsi
-- SECURITY DEFINER "ajukan_surat_publik". Fungsi ini yang menyimpan
-- baris langsung dengan status akhir 'menunggu_verifikasi' (bypass
-- RLS di dalam fungsi, tapi validasi input dilakukan di dalam fungsi
-- itu sendiri, jadi tetap aman). Setelah ini, policy INSERT/UPDATE
-- langsung ke tabel `surat` untuk anon TIDAK dibutuhkan lagi -> jalur
-- akses publik ke tabel `surat` dipersempit jadi hanya lewat fungsi
-- ini, tidak lewat insert/update bebas. Ini juga menutup celah lain:
-- sebelumnya anon bisa INSERT row dengan status 'draf_publik' dan
-- membiarkannya "menggantung" tanpa verifikasi.
-- =========================================================

create or replace function public.ajukan_surat_publik(
    p_jenis_surat_id uuid,
    p_nik_pemohon text,
    p_nama_pemohon text,
    p_no_hp_pemohon text,
    p_isi_surat text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_id uuid;
begin
    if p_nik_pemohon is null or p_nik_pemohon !~ '^\d{16}$' then
        raise exception 'NIK harus 16 digit angka.';
    end if;
    if p_nama_pemohon is null or length(trim(p_nama_pemohon)) < 3 then
        raise exception 'Nama lengkap wajib diisi.';
    end if;
    if p_no_hp_pemohon is null or p_no_hp_pemohon !~ '^0\d{9,13}$' then
        raise exception 'Nomor WhatsApp tidak valid (mulai dengan 0).';
    end if;
    if p_jenis_surat_id is null or not exists (select 1 from public.jenis_surat where id = p_jenis_surat_id) then
        raise exception 'Jenis surat tidak valid.';
    end if;

    insert into public.surat (
        jenis_surat_id, nik_pemohon, nama_pemohon, no_hp_pemohon,
        isi_surat, status, diajukan_tanpa_login
    ) values (
        p_jenis_surat_id, p_nik_pemohon, trim(p_nama_pemohon), p_no_hp_pemohon,
        p_isi_surat, 'menunggu_verifikasi', true
    )
    returning id into v_id;

    return v_id;
end;
$$;

grant execute on function public.ajukan_surat_publik(uuid, text, text, text, text) to anon;

-- Persempit akses langsung ke tabel: cabut policy INSERT anon lama
-- (sekarang semua pengajuan publik wajib lewat fungsi di atas).
drop policy if exists "surat_public_insert" on public.surat;

-- =========================================================
-- VERIFIKASI:
-- select public.ajukan_surat_publik(
--   (select id from jenis_surat limit 1),
--   '3573012712770001', 'Test Warga', '081234567890', 'Uji coba'
-- );
-- -> harus mengembalikan sebuah uuid tanpa error, dan baris baru
--    di tabel surat langsung berstatus 'menunggu_verifikasi'.
-- =========================================================
