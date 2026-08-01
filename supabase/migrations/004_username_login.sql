-- =========================================================
-- SILAT RT — REVISI: LOGIN BERBASIS USERNAME (bukan email)
-- Dijalankan SETELAH 05a, 05b, 05c
-- =========================================================

-- Supabase Auth secara internal tetap mensyaratkan kolom "email" yang unik.
-- Solusi: pengguna cukup mengetik USERNAME sederhana (mis. "ketua.rt", "sekretaris.lam"),
-- lalu aplikasi frontend menyusun email sintetis "{username}@silatrt.local" secara
-- otomatis sebelum memanggil supabase.auth.signInWithPassword(). Pengguna tidak pernah
-- melihat atau perlu mengingat format email ini.

-- ---------------------------------------------------------
-- 1. Tambah kolom username ke public.users
-- ---------------------------------------------------------
alter table public.users
    add column username varchar(50) unique;

-- Format username: huruf kecil, angka, titik saja (mis. pak.rt, sekretaris.lam, bendahara.rt)
alter table public.users
    add constraint chk_username_format check (username ~ '^[a-z0-9.]{3,50}$');

create index idx_users_username on public.users(username);

-- ---------------------------------------------------------
-- 2. Update trigger auto-insert agar ikut menyimpan username
--    (username dikirim lewat raw_user_meta_data saat admin membuat akun)
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

    insert into public.users (id, role_id, email, nama_lengkap, username)
    values (
        new.id,
        default_role_id,
        new.email,
        coalesce(new.raw_user_meta_data ->> 'nama_lengkap', new.email),
        new.raw_user_meta_data ->> 'username'
    );
    return new;
end;
$$;

-- ---------------------------------------------------------
-- 3. Contoh konvensi username per jabatan (dipakai saat admin
--    mendaftarkan pengurus baru lewat modul Admin > Kelola Pengguna)
-- ---------------------------------------------------------
-- Ketua RT              -> ketua.rt
-- Sekretaris RT         -> sekretaris.rt
-- Bendahara RT          -> bendahara.rt
-- Ketua RW (opsional)   -> ketua.rw
-- Ketua Takmir          -> ketua.lam        (LAM = singkatan/inisial nama langgar, dikonfigurasi admin)
-- Sekretaris Takmir     -> sekretaris.lam
-- Bendahara Takmir      -> bendahara.lam
-- Imam                  -> imam.lam / nama depan imam jika lebih dari satu
-- PKK / Operator lain   -> pkk.rt, operator.rt, dst — bebas ditentukan admin selama unik
-- Warga umum            -> nama depan + inisial (mis. ahmad.r), atau NIK 6 digit terakhir jika nama pasaran

-- Catatan penting: username BUKAN kolom login Supabase Auth itu sendiri — ia hanya
-- alias tampilan. Proses pembuatan akun tetap lewat Supabase Admin API dengan email
-- sintetis "{username}@silatrt.local", sehingga tetap sepenuhnya kompatibel dengan
-- RLS dan seluruh policy Tahap 5 yang sudah ada (semuanya berbasis auth.uid(), tidak berubah).
