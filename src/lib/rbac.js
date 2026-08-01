// =========================================================
// SILAT RT — src/lib/rbac.js
// Peta menu bottom-nav & akses halaman per role (Tahap 6-B.10).
// RLS di database adalah penjaga utama; helper ini hanya
// mengatur apa yang DITAMPILKAN di UI agar sesuai pengalaman role.
// =========================================================

export const NAV_BY_ROLE = {
  'Ketua RT':        [ 'beranda', 'warga', 'surat', 'keuangan-rt', 'lainnya' ],
  'Sekretaris RT':   [ 'beranda', 'warga', 'surat', 'agenda', 'lainnya' ],
  'Bendahara RT':    [ 'beranda', 'keuangan-rt', 'laporan-rt', 'lainnya' ],
  'Ketua RW':        [ 'beranda', 'surat-rw', 'laporan-rt', 'lainnya' ],
  'Sekretaris RW':   [ 'beranda', 'surat-rw', 'lainnya' ],
  'Ketua Takmir':    [ 'beranda', 'langgar', 'jadwal', 'kas-takmir', 'lainnya' ],
  'Sekretaris Takmir': [ 'beranda', 'langgar', 'jadwal', 'undangan', 'lainnya' ],
  'Bendahara Takmir': [ 'beranda', 'kas-takmir', 'laporan-takmir', 'lainnya' ],
  'Imam':            [ 'beranda', 'jadwal', 'profil' ],
  'Operator':        [ 'beranda', 'tugas', 'profil' ],
  'Warga':           [ 'beranda', 'surat-saya', 'agenda', 'pengumuman', 'profil' ],
  'Administrator':   [ 'beranda', 'pengguna', 'data', 'laporan', 'sistem' ],
};

/** Role yang boleh memproses tiap tahap alur surat (revisi 05e) */
export const SURAT_WORKFLOW_ROLE = {
  menunggu_verifikasi: ['Sekretaris RT', 'Administrator'],
  perlu_perbaikan: [], // menunggu warga memperbaiki, tidak ada aksi pengurus
  terverifikasi_sekretaris_rt: ['Ketua RT', 'Administrator'],
  ditandatangani_rt: ['Ketua RW', 'Sekretaris RW', 'Administrator'],
  diteruskan_rw: ['Ketua RW', 'Administrator'],
};

export function getNavForRole(role) {
  return NAV_BY_ROLE[role] || ['beranda'];
}

export function canActOnSurat(role, status) {
  const allowed = SURAT_WORKFLOW_ROLE[status] || [];
  return allowed.includes(role);
}
