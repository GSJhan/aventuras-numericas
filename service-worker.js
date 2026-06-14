const CACHE_NAME = 'aventuras-numericas-v2';

// Estrategia Network-First para archivos de lógica para ver cambios inmediatos
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Network-first para todo durante desarrollo/pruebas
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
