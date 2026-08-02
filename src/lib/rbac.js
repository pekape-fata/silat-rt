// =========================================================
// SILAT RT — src/lib/rbac.js
// Peta menu bottom-nav & akses halaman per role, DAN peta kapabilitas
// (siapa boleh tambah/ubah/hapus apa). RLS di database (lihat
// supabase/migrations/002, 005, 007, 009) adalah PENJAGA UTAMA —
// helper di sini hanya mengatur apa yang DITAMPILKAN di UI agar sesuai
// pengalaman tiap peran. Jangan pernah mengandalkan file ini sendirian
// untuk keamanan data.
//
// STRUKTUR PERAN (ringkas):
// - "Ketua" (Ketua RT / Ketua RW / Ketua Takmir) adalah pemegang
//   jabatan tertinggi di wilayahnya masing-masing: fokus pada
//   PERSETUJUAN & TANDA TANGAN, bukan entri data harian.
// - "Sekretaris" (RT/RW/Takmir) mengelola ADMINISTRASI & SURAT-MENYURAT:
//   input data warga, memverifikasi & menyiapkan surat, agenda,
//   undangan — boleh tambah/ubah/kirim, tapi tanda tangan akhir tetap
//   di tangan Ketua terkait.
// - "Bendahara" (RT/RW/Takmir) mengelola KEUANGAN: catat transaksi,
//   iuran, kas, unduh/cetak laporan.
// - "PKK RT" fokus pada program kesejahteraan keluarga & sosial warga
//   (modul dedicated menyusul; untuk saat ini akses baca agenda &
//   pengumuman serta data warga seperti pengurus RT lainnya).
// - Ketua RT terhubung berjenjang ke Ketua RW (alur tanda tangan surat
//   naik dari RT ke RW). Ketua Takmir dapat terhubung ke Ketua RT/RW
//   untuk urusan lintas kelembagaan (agenda bersama, undangan).
// =========================================================

export const NAV_BY_ROLE = {
  'Ketua RT':          [ 'beranda', 'warga', 'surat', 'keuangan-rt', 'lainnya' ],
  'Sekretaris RT':     [ 'beranda', 'warga', 'surat', 'agenda', 'lainnya' ],
  'Bendahara RT':      [ 'beranda', 'keuangan-rt', 'laporan-rt', 'lainnya' ],
  'PKK RT':            [ 'beranda', 'warga', 'agenda', 'pengumuman', 'lainnya' ],
  'Ketua RW':          [ 'beranda', 'surat-rw', 'laporan-rw', 'lainnya' ],
  'Sekretaris RW':     [ 'beranda', 'surat-rw', 'agenda', 'lainnya' ],
  'Bendahara RW':      [ 'beranda', 'laporan-rw', 'lainnya' ],
  'Ketua Takmir':      [ 'beranda', 'langgar', 'jadwal', 'kas-takmir', 'lainnya' ],
  'Sekretaris Takmir': [ 'beranda', 'langgar', 'jadwal', 'undangan', 'lainnya' ],
  'Bendahara Takmir':  [ 'beranda', 'kas-takmir', 'laporan-takmir', 'lainnya' ],
  'Imam':              [ 'beranda', 'jadwal', 'profil' ],
  'Operator':          [ 'beranda', 'tugas', 'profil' ],
  'Warga':             [ 'beranda', 'surat-saya', 'agenda', 'pengumuman', 'profil' ],
  'Administrator':     [ 'beranda', 'pengguna', 'data', 'laporan', 'sistem' ],
};

/**
 * Peta kapabilitas CRUD per modul. Dipakai untuk menampilkan/menyembunyikan
 * tombol "Tambah", "Edit", "Hapus", "Kirim", "Unduh/Cetak" di halaman —
 * mencerminkan pemisahan tugas Ketua (approve/TTD) vs Sekretaris (admin
 * surat & data warga) vs Bendahara (keuangan). Selalu dicerminkan oleh
 * policy RLS yang senyatanya menegakkan aturan ini di database.
 */
export const CAPABILITIES = {
  warga: {
    write: ['Ketua RT', 'Sekretaris RT', 'Administrator'],
    read:  ['Ketua RT', 'Sekretaris RT', 'Bendahara RT', 'PKK RT', 'Administrator'],
  },
  surat: {
    // Sekretaris RT: verifikasi & susun draf. Ketua RT: TTD tahap RT.
    // Sekretaris/Ketua RW: TTD & terbitkan tahap RW. Bendahara tidak terlibat.
    write: ['Sekretaris RT', 'Ketua RT', 'Ketua RW', 'Sekretaris RW', 'Administrator'],
  },
  'keuangan-rt': {
    write: ['Bendahara RT', 'Administrator'],
    read:  ['Ketua RT', 'Sekretaris RT', 'Bendahara RT', 'Ketua RW', 'Bendahara RW', 'Administrator'],
  },
  'keuangan-takmir': {
    write: ['Bendahara Takmir', 'Administrator'],
    read:  ['Ketua Takmir', 'Sekretaris Takmir', 'Bendahara Takmir', 'Administrator'],
  },
  agenda: {
    write: ['Ketua RT', 'Sekretaris RT', 'Sekretaris RW', 'Ketua Takmir', 'Sekretaris Takmir', 'Administrator'],
  },
  pengumuman: {
    write: ['Ketua RT', 'Sekretaris RT', 'PKK RT', 'Ketua RW', 'Sekretaris RW', 'Bendahara RW',
            'Ketua Takmir', 'Sekretaris Takmir', 'Bendahara Takmir', 'Administrator'],
  },
  undangan: {
    // Sesuai RLS "undangan_write_takmir" — Bendahara Takmir sengaja
    // TIDAK termasuk (hanya baca/lihat kalender acara).
    write: ['Sekretaris Takmir', 'Ketua Takmir', 'Administrator'],
  },
};

export function canManage(module, role) {
  if (role === 'Administrator') return true;
  return (CAPABILITIES[module]?.write || []).includes(role);
}

/** Role yang boleh memproses tiap tahap alur surat (sinkron dengan RLS
 *  migration "007 perbaikan rls surat berjenjang.sql"). */
export const SURAT_WORKFLOW_ROLE = {
  menunggu_verifikasi: ['Sekretaris RT', 'Administrator'],
  perlu_perbaikan: [], // menunggu warga memperbaiki, tidak ada aksi pengurus
  terverifikasi_sekretaris_rt: ['Ketua RT', 'Administrator'],
  ditandatangani_rt: ['Ketua RW', 'Sekretaris RW', 'Administrator'],
  diteruskan_rw: ['Ketua RW', 'Sekretaris RW', 'Administrator'],
};

/* Ikon SVG (outline, 24x24) — menggantikan emoji agar tampilan lebih
   profesional dan konsisten lintas platform/OS. */
const ICON = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5 12 3l9 6.5"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"/><path d="M21 12h-4a2 2 0 0 0 0 4h4"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/></svg>',
  mosque: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21v-7l7-6 7 6v7"/><path d="M12 3v3M9 9a3 3 0 0 1 6 0"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  megaphone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v3a1 1 0 0 0 1 1h2l4 4V6l-4 4H4a1 1 0 0 0-1 1Z"/><path d="M15 8a4 4 0 0 1 0 8M18 5a8 8 0 0 1 0 14"/></svg>',
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z"/></svg>',
  dots: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>',
};

/**
 * Metadata tampilan bottom-nav per key: ikon, label, dan rute (hash) jika
 * halamannya sudah dibangun DAN diizinkan RLS untuk role terkait. Key
 * tanpa `route` berarti modulnya belum dibangun pada tahap ini — tombol
 * tetap tampil (agar peta navigasi sesuai desain organisasi) tapi
 * mengklik-nya menampilkan status pengembangan yang jelas & informatif,
 * bukan redirect diam-diam atau alert kasar.
 *
 * PENTING: jangan memetakan sebuah key ke `route` milik modul yang RLS/
 * role-guard-nya tidak mengizinkan role tersebut (lihat roles per-route
 * di router.js) — itu hanya akan membawa pengguna ke halaman "akses
 * ditolak". Gunakan key khusus tanpa `route` untuk kasus itu (mis.
 * 'laporan-rw' untuk Ketua/Bendahara RW, karena modul laporan level-RW
 * gabungan belum dibangun dan `/keuangan-rt` hanya untuk role RT).
 */
export const NAV_ITEM_META = {
  'beranda':        { icon: ICON.home, label: 'Beranda', route: '/dashboard' },
  'warga':          { icon: ICON.users, label: 'Warga' },
  'surat':          { icon: ICON.doc, label: 'Surat' },
  'keuangan-rt':    { icon: ICON.wallet, label: 'Keuangan', route: '/keuangan-rt' },
  'laporan-rt':     { icon: ICON.chart, label: 'Laporan RT', route: '/keuangan-rt' },
  'laporan-rw':     { icon: ICON.chart, label: 'Laporan RW' },
  'kas-takmir':     { icon: ICON.wallet, label: 'Kas Takmir', route: '/keuangan-takmir' },
  'laporan-takmir': { icon: ICON.chart, label: 'Laporan', route: '/keuangan-takmir' },
  'langgar':        { icon: ICON.mosque, label: 'Langgar' },
  'jadwal':         { icon: ICON.clock, label: 'Jadwal' },
  'undangan':       { icon: ICON.mail, label: 'Undangan', route: '/undangan' },
  'tugas':          { icon: ICON.check, label: 'Tugas' },
  'profil':         { icon: ICON.user, label: 'Profil' },
  'surat-saya':     { icon: ICON.doc, label: 'Surat Saya' },
  'agenda':         { icon: ICON.calendar, label: 'Agenda' },
  'pengumuman':     { icon: ICON.megaphone, label: 'Info', route: '/pengumuman' },
  'pengguna':       { icon: ICON.users, label: 'Pengguna' },
  'data':           { icon: ICON.folder, label: 'Data' },
  'sistem':         { icon: ICON.settings, label: 'Sistem' },
  'surat-rw':       { icon: ICON.doc, label: 'Surat RW' },
  'lainnya':        { icon: ICON.dots, label: 'Lainnya' },
};

export function getNavForRole(role) {
  return NAV_BY_ROLE[role] || ['beranda'];
}

export function canActOnSurat(role, status) {
  const allowed = SURAT_WORKFLOW_ROLE[status] || [];
  return allowed.includes(role);
}
