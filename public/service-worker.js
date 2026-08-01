// public/service-worker.js
// Strategi dasar: cache-first untuk aset statis, network-first untuk data.
// Akan diperluas di Tahap 13 saat pembungkusan APK (Bubblewrap/Capacitor).
const CACHE_NAME = 'silat-rt-cache-v1';
const ASSET_TO_CACHE = [
  '/',
  '/index.html',
  '/src/assets/css/tokens.css',
  '/src/assets/css/base.css',
  '/src/assets/css/components.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSET_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (event) => {
  // Jangan cache request ke Supabase — selalu network (data harus realtime/fresh)
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
