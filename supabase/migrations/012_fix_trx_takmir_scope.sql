-- =========================================================
-- SILAT RT — 012_fix_trx_takmir_scope.sql
-- Dijalankan SETELAH 011_fix_log_aktivitas_audit.sql
--
-- BUG YANG DIPERBAIKI (dikonfirmasi lewat kode, bukan dugaan):
-- Policy "trx_takmir_select_scope" (002_rls_policies.sql, baris
-- ~271) punya klausa "OR auth.role() = 'authenticated'" yang
-- membuat pembatasan per-langgar sebelumnya jadi tidak berarti —
-- siapa pun yang login bisa melihat transaksi keuangan takmir dari
-- LANGGAR MANAPUN, bukan cuma langgar tempat dia bertugas.
--
-- Bukti dari kode: src/pages/keuangan-takmir/keuangan-takmir.js
-- mengambil SATU langgar aktif milik pengguna (fungsi
-- muatLanggarAktif) dan menampilkan nama langgar tunggal di UI
-- (#kt-langgar-nama), tapi query muatSemuaTransaksi() TIDAK
-- memfilter langgar_id sama sekali — murni mengandalkan RLS.
-- Karena RLS-nya longgar, bendahara takmir Langgar A saat ini bisa
-- melihat (dan komposisi grafiknya tercampur dengan) transaksi
-- keuangan Langgar B, C, dst. Ini jelas bug, bukan desain transparansi
-- yang disengaja — UI-nya sendiri berniat menampilkan satu langgar saja.
--
-- PERBAIKAN:
-- Hapus klausa "OR auth.role() = 'authenticated'", kembalikan ke
-- scope per-langgar sesuai current_langgar_ids().
-- =========================================================

drop policy if exists "trx_takmir_select_scope" on public.transaksi_keuangan_takmir;

create policy "trx_takmir_select_scope" on public.transaksi_keuangan_takmir for select
    using (
        public.is_admin()
        or langgar_id in (select * from public.current_langgar_ids())
    );

-- =========================================================
-- VERIFIKASI:
-- 1. Login sebagai Bendahara/Ketua/Sekretaris Takmir Langgar A.
-- 2. Buka dashboard Keuangan Takmir.
-- 3. Hasil yang benar: hanya transaksi Langgar A yang tampil,
--    grafik & total saldo tidak lagi tercampur dengan langgar lain.
-- =========================================================
