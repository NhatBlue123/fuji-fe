// FUJI Custom Offline Service Worker
const CACHE_NAME = 'fuji-offline-v2';
const OFFLINE_URL = '/offline.html';

// Cache the offline page on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Intercept navigation requests — show offline page when network fails
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(OFFLINE_URL).then(
        (cached) => cached || new Response('<h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' } })
      )
    )
  );
});
