// =========================================================
// SILAT RT — src/router.js
// Router ringan berbasis hash (tanpa framework), + auth guard
// + app-shell (top bar & bottom nav) untuk halaman terautentikasi.
// =========================================================
import { getCurrentProfile, logout } from './lib/auth.js';
import { getNavForRole, NAV_ITEM_META } from './lib/rbac.js';

const routes = {
  '/login': { html: '/src/pages/auth/login.html', js: '/src/pages/auth/login.js', public: true },
  '/ajukan-surat': { html: '/src/pages/surat/ajukan-surat-publik.html', js: '/src/pages/surat/ajukan-surat-publik.js', public: true },
  '/verifikasi-surat': { html: '/src/pages/surat/verifikasi-surat.html', js: '/src/pages/surat/verifikasi-surat.js', public: true },
  '/antrian-surat': { html: '/src/pages/surat/antrian-surat.html', js: '/src/pages/surat/antrian-surat.js', roles: ['Sekretaris RT', 'Administrator'] },
  '/approval-surat': { html: '/src/pages/surat/approval-surat.html', js: '/src/pages/surat/approval-surat.js', roles: ['Ketua RT', 'Ketua RW', 'Sekretaris RW', 'Administrator'] },
  '/preview-surat': { html: '/src/pages/surat/preview-surat.html', js: '/src/pages/surat/preview-surat.js', roles: ['Sekretaris RT', 'Ketua RT', 'Ketua RW', 'Sekretaris RW', 'Administrator'] },
  '/dashboard': { html: '/src/pages/dashboard/dashboard-pengurus.html', js: '/src/pages/dashboard/dashboard-pengurus.js', public: false },
  '/keuangan-rt': {
    html: '/src/pages/keuangan-rt/keuangan-rt.html',
    js: '/src/pages/keuangan-rt/keuangan-rt.js',
    roles: ['Bendahara RT', 'Ketua RT', 'Sekretaris RT', 'Administrator'],
  },
  '/keuangan-takmir': {
    html: '/src/pages/keuangan-takmir/keuangan-takmir.html',
    js: '/src/pages/keuangan-takmir/keuangan-takmir.js',
    roles: ['Bendahara Takmir', 'Ketua Takmir', 'Sekretaris Takmir', 'Administrator'],
  },
};

// Rute hash yang benar-benar sudah dibangun — dipakai untuk memutuskan
// apakah sebuah item bottom-nav bisa diklik-navigasi atau hanya "stub".
const BUILT_ROUTES = new Set(Object.keys(routes));

const outlet = () => document.getElementById('app-outlet');

function initials(text) {
  return String(text || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const ICON_THEME = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>';

// Deskripsi singkat tiap modul yang belum dibangun — dipakai di panel
// "Segera Hadir" (menggantikan alert() bawaan browser yang kurang
// informatif) supaya pengguna paham APA yang akan hadir dan KAPAN
// kira-kira, bukan sekadar pesan generik.
const ROADMAP_INFO = {
  'Warga':        { fase: 'Tahap berikutnya', desc: 'Kelola data warga & Kartu Keluarga per RT: tambah/ubah/hapus data, riwayat pindah/lahir/meninggal, dan kode QR identitas warga.' },
  'Surat':        { fase: 'Tahap berikutnya', desc: 'Antrian verifikasi, penandatanganan, dan riwayat surat masuk khusus pengurus RT (form pengajuan publik sudah aktif di luar login).' },
  'Surat RW':     { fase: 'Tahap berikutnya', desc: 'Antrian surat yang diteruskan dari RT untuk ditandatangani/diterbitkan di tingkat RW.' },
  'Laporan RW':   { fase: 'Direncanakan', desc: 'Rekap keuangan gabungan seluruh RT di bawah RW ini, dapat diunduh sebagai laporan bulanan.' },
  'Langgar':      { fase: 'Direncanakan', desc: 'Profil langgar/masjid, data inventaris, dan riwayat kegiatan.' },
  'Jadwal':       { fase: 'Direncanakan', desc: 'Jadwal imam & jadwal sholat otomatis tersinkron dari sumber jadwal sholat wilayah.' },
  'Undangan':     { fase: 'Direncanakan', desc: 'Buat & kirim undangan digital ke warga, lengkap dengan QR verifikasi kehadiran.' },
  'Tugas':        { fase: 'Direncanakan', desc: 'Daftar tugas operasional yang ditugaskan ke Operator, lengkap status penyelesaian.' },
  'Profil':       { fase: 'Tahap berikutnya', desc: 'Kelola data akun pribadi, foto, nomor WhatsApp, dan preferensi notifikasi.' },
  'Surat Saya':   { fase: 'Tahap berikutnya', desc: 'Riwayat & status pengajuan surat milik Anda sendiri, termasuk unduh PDF setelah terbit.' },
  'Agenda':       { fase: 'Direncanakan', desc: 'Kalender kegiatan RT/RW/Takmir yang bisa dilihat seluruh warga.' },
  'Info':         { fase: 'Direncanakan', desc: 'Papan pengumuman resmi dari pengurus RT/RW/Takmir.' },
  'Pengguna':     { fase: 'Tahap berikutnya', desc: 'Administrator mengelola akun & peran seluruh pengurus dan warga.' },
  'Data':         { fase: 'Direncanakan', desc: 'Ekspor/impor data master (wilayah, warga, jenis surat, kategori kas).' },
  'Sistem':       { fase: 'Direncanakan', desc: 'Pengaturan umum aplikasi, log aktivitas, dan cadangan (backup) database.' },
};

function showRoadmapPanel(label) {
  document.getElementById('roadmap-overlay')?.remove();
  const info = ROADMAP_INFO[label] || { fase: 'Direncanakan', desc: 'Modul ini akan segera hadir pada pembaruan mendatang.' };

  const overlay = document.createElement('div');
  overlay.id = 'roadmap-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,36,32,0.45);backdrop-filter:blur(2px);z-index:100;display:flex;align-items:flex-end;justify-content:center;animation:page-fade-in 180ms ease;';
  overlay.innerHTML = `
    <div class="card" style="width:100%;max-width:440px;border-bottom-left-radius:0;border-bottom-right-radius:0;margin:0;">
      <div class="card-body">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
          <div style="width:42px;height:42px;border-radius:12px;background:var(--color-secondary-container);color:#8A5A15;display:flex;align-items:center;justify-content:center;flex:0 0 auto;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
          </div>
          <div>
            <div class="fw-bold" style="font-family:var(--font-display);">${label}</div>
            <span class="status-badge" data-status="menunggu_verifikasi">${info.fase}</span>
          </div>
        </div>
        <p class="text-caption mb-3" style="font-size:14px;color:var(--color-text-primary);">${info.desc}</p>
        <button type="button" class="btn btn-outline-secondary w-100" id="roadmap-close">Tutup</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.getElementById('roadmap-close').addEventListener('click', close);
}

function renderShell(profile, activeRoutePath) {
  const navKeys = getNavForRole(profile.role);

  const navHtml = navKeys.map(key => {
    const meta = NAV_ITEM_META[key] || { icon: '•', label: key };
    const built = meta.route && BUILT_ROUTES.has(meta.route);
    const active = built && meta.route === activeRoutePath;
    if (built) {
      return `<a href="#${meta.route}" class="app-bottomnav__item${active ? ' active' : ''}">
        <span aria-hidden="true">${meta.icon}</span><span>${meta.label}</span>
      </a>`;
    }
    return `<button type="button" class="app-bottomnav__item app-bottomnav__item--stub" data-label="${meta.label}" style="background:none;border:none;">
      <span aria-hidden="true">${meta.icon}</span><span>${meta.label}</span>
    </button>`;
  }).join('');

  return `
    <header class="app-topbar">
      <div class="app-topbar__brand">
        <div class="app-topbar__logo">SR</div>
        <p class="app-topbar__title">SILAT RT</p>
      </div>
      <span class="app-topbar__badge-role">${profile.role || ''}</span>
      <button type="button" class="icon-btn" id="btn-toggle-theme" title="Ganti tema">${ICON_THEME}</button>
      <button type="button" class="avatar-btn" id="btn-avatar-logout" title="Keluar">
        ${initials(profile.nama_lengkap || profile.username)}
      </button>
    </header>
    <main id="page-content" style="padding-bottom:104px; max-width:640px; margin:0 auto;"></main>
    <nav class="app-bottomnav">${navHtml}</nav>
  `;
}

export async function renderRoute() {
  const path = (location.hash.replace('#', '') || '/login');
  const [routePath, query] = path.split('?');
  const route = routes[routePath] || routes['/login'];

  let profile = null;
  if (!route.public) {
    profile = await getCurrentProfile();
    if (!profile) { location.hash = '#/login'; return; }
    if (route.roles && !route.roles.includes(profile.role)) {
      outlet().innerHTML = `<div class="alert alert-warning m-3">Anda tidak memiliki akses ke halaman ini.</div>`;
      return;
    }
  }

  const html = await fetch(route.html).then(r => r.text());

  let contentTarget;
  if (route.public) {
    outlet().innerHTML = html;
    contentTarget = outlet();
  } else {
    outlet().innerHTML = renderShell(profile, routePath);
    document.getElementById('page-content').innerHTML = html;
    contentTarget = document.getElementById('page-content');

    document.getElementById('btn-toggle-theme')?.addEventListener('click', () => window.toggleTheme());
    document.getElementById('btn-avatar-logout')?.addEventListener('click', () => {
      if (confirm('Keluar dari SILAT RT?')) logout();
    });
    outlet().querySelectorAll('.app-bottomnav__item--stub').forEach(btn => {
      btn.addEventListener('click', () => showRoadmapPanel(btn.dataset.label));
    });
  }

  // Muat JS halaman sebagai module baru tiap navigasi (hindari cache stale state)
  const mod = await import(`${route.js}?t=${Date.now()}`);
  if (mod.init) mod.init(new URLSearchParams(query), profile, contentTarget);
}

window.addEventListener('hashchange', renderRoute);
window.addEventListener('DOMContentLoaded', renderRoute);
