const CACHE_NAME = 'aventuras-numericas-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/menu.html',
  '/game.html',
  '/style.css',
  '/main.js',
  '/menu.js',
  '/game.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
