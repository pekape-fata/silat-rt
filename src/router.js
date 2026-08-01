// =========================================================
// SILAT RT — src/router.js
// Router ringan berbasis hash (tanpa framework), + auth guard.
// =========================================================
import { getCurrentProfile } from './lib/auth.js';

const routes = {
  '/login': { html: '/src/pages/auth/login.html', js: '/src/pages/auth/login.js', public: true },
  '/ajukan-surat': { html: '/src/pages/surat/ajukan-surat-publik.html', js: '/src/pages/surat/ajukan-surat-publik.js', public: true },
  '/verifikasi-surat': { html: '/src/pages/surat/verifikasi-surat.html', js: '/src/pages/surat/verifikasi-surat.js', public: true },
  '/antrian-surat': { html: '/src/pages/surat/antrian-surat.html', js: '/src/pages/surat/antrian-surat.js', roles: ['Sekretaris RT', 'Administrator'] },
  '/approval-surat': { html: '/src/pages/surat/approval-surat.html', js: '/src/pages/surat/approval-surat.js', roles: ['Ketua RT', 'Ketua RW', 'Sekretaris RW', 'Administrator'] },
  '/preview-surat': { html: '/src/pages/surat/preview-surat.html', js: '/src/pages/surat/preview-surat.js', roles: ['Sekretaris RT', 'Ketua RT', 'Ketua RW', 'Sekretaris RW', 'Administrator'] },
  '/dashboard': { html: '/src/pages/dashboard/dashboard-pengurus.html', js: '/src/pages/dashboard/dashboard-pengurus.js', public: false },
};

const outlet = () => document.getElementById('app-outlet');

export async function renderRoute() {
  const path = (location.hash.replace('#', '') || '/login');
  const [routePath, query] = path.split('?');
  const route = routes[routePath] || routes['/login'];

  // Guard akses
  if (!route.public) {
    const profile = await getCurrentProfile();
    if (!profile) { location.hash = '#/login'; return; }
    if (route.roles && !route.roles.includes(profile.role)) {
      outlet().innerHTML = `<div class="alert alert-warning m-3">Anda tidak memiliki akses ke halaman ini.</div>`;
      return;
    }
  }

  const html = await fetch(route.html).then(r => r.text());
  outlet().innerHTML = html;

  // Muat JS halaman sebagai module baru tiap navigasi (hindari cache stale state)
  const mod = await import(`${route.js}?t=${Date.now()}`);
  if (mod.init) mod.init(new URLSearchParams(query));
}

window.addEventListener('hashchange', renderRoute);
window.addEventListener('DOMContentLoaded', renderRoute);
