-- =========================================================
-- SILAT RT — 014_public_select_langgar.sql
--
-- KEBUTUHAN: halaman depan (tanpa login) perlu menampilkan nama
-- langgar & koordinat lokasi untuk menghitung jadwal sholat. Saat
-- ini tabel `langgar` hanya bisa di-SELECT oleh user yang login
-- (policy "langgar_select_authenticated").
--
-- Kolom di tabel `langgar` (nama, alamat, koordinat, foto, sejarah,
-- visi, misi) semuanya memang informasi publik institusi (setara
-- info yang sudah tercetak di kop surat), bukan data pribadi warga —
-- aman dibuka untuk publik.
-- =========================================================

drop policy if exists "langgar_select_public" on public.langgar;

create policy "langgar_select_public" on public.langgar for select
    to anon
    using (true);

-- Policy "langgar_select_authenticated" yang sudah ada tetap
-- dipertahankan (tidak konflik — Postgres RLS bersifat OR antar
-- policy yang cocok untuk perintah & role yang sama).
