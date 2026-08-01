-- =========================================================
-- SILAT RT — 008_seed_kategori_takmir.sql
-- Seed kategori kas takmir default (idempotent — aman dijalankan ulang).
-- Dibutuhkan agar modul Kas Takmir (Tahap 8) punya pilihan kategori transaksi.
-- =========================================================

insert into public.kategori_kas_takmir (nama_kategori) values
    ('Infaq Jumat'),
    ('Donasi Warga'),
    ('Kotak Amal'),
    ('Operasional Rutin'),
    ('Listrik & Air'),
    ('Renovasi & Perawatan'),
    ('Kegiatan/Peringatan Hari Besar'),
    ('Honor Imam/Marbot'),
    ('Lainnya')
on conflict (nama_kategori) do nothing;
