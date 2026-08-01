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
      btn.addEventListener('click', () => alert(`Modul "${btn.dataset.label}" sedang dikembangkan pada tahap berikutnya.`));
    });
  }

  // Muat JS halaman sebagai module baru tiap navigasi (hindari cache stale state)
  const mod = await import(`${route.js}?t=${Date.now()}`);
  if (mod.init) mod.init(new URLSearchParams(query), profile, contentTarget);
}

window.addEventListener('hashchange', renderRoute);
window.addEventListener('DOMContentLoaded', renderRoute);
