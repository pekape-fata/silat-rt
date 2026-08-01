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

/**
 * Metadata tampilan bottom-nav per key: ikon, label, dan rute (hash) jika
 * halamannya sudah dibangun. Key tanpa `route` berarti modulnya belum
 * dibangun pada tahap ini — tombol tetap tampil (agar peta navigasi sesuai
 * desain) tapi mengklik-nya hanya menampilkan info "segera hadir", bukan
 * redirect diam-diam ke halaman lain.
 */
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

export const NAV_ITEM_META = {
  'beranda':        { icon: ICON.home, label: 'Beranda', route: '/dashboard' },
  'warga':          { icon: ICON.users, label: 'Warga' },
  'surat':          { icon: ICON.doc, label: 'Surat' },
  'keuangan-rt':    { icon: ICON.wallet, label: 'Keuangan', route: '/keuangan-rt' },
  'laporan-rt':     { icon: ICON.chart, label: 'Laporan RT', route: '/keuangan-rt' },
  'kas-takmir':     { icon: ICON.wallet, label: 'Kas Takmir', route: '/keuangan-takmir' },
  'laporan-takmir': { icon: ICON.chart, label: 'Laporan', route: '/keuangan-takmir' },
  'langgar':        { icon: ICON.mosque, label: 'Langgar' },
  'jadwal':         { icon: ICON.clock, label: 'Jadwal' },
  'undangan':       { icon: ICON.mail, label: 'Undangan' },
  'tugas':          { icon: ICON.check, label: 'Tugas' },
  'profil':         { icon: ICON.user, label: 'Profil' },
  'surat-saya':     { icon: ICON.doc, label: 'Surat Saya' },
  'agenda':         { icon: ICON.calendar, label: 'Agenda' },
  'pengumuman':     { icon: ICON.megaphone, label: 'Info' },
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
