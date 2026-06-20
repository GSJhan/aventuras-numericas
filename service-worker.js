const CACHE_NAME = 'aventuras-numericas-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/menu.html',
  '/game.html',
  '/style.css',
  '/main.js',
  '/menu.js',
  '/game.js',
  '/achievements.js',
  '/global-achievements.js',
  '/equation-solver.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
