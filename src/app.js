// =========================================================
// SILAT RT — src/app.js
// Entry point: init tema, service worker, dan router.
// =========================================================
import './router.js';

// Tema tersimpan per sesi (bukan localStorage browser biasa, tapi
// preferensi tema disinkron ke public.users pada implementasi penuh)
const savedTheme = sessionStorage.getItem('silatrt-theme') || 'light';
document.body.setAttribute('data-theme', savedTheme);

window.toggleTheme = function () {
  const current = document.body.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', next);
  sessionStorage.setItem('silatrt-theme', next);
};

// Registrasi service worker untuk mode PWA/offline (Tahap 7: public/service-worker.js)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/public/service-worker.js').catch(console.error);
  });
}
