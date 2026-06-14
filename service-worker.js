const CACHE_NAME = 'aventuras-numericas-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/menu.html',
  '/game.html',
  '/style.css',
  '/main.js',
  '/menu.js',
  '/game.js',
  '/skills.js',
  '/duels.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;600&display=swap',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'
];

// Instalar el service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache).catch(err => {
          console.warn('Algunos recursos no pudieron ser cacheados:', err);
          // Continuar incluso si algunos recursos fallan
          return Promise.resolve();
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activar el service worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar solicitudes
self.addEventListener('fetch', event => {
  // Solo cachear solicitudes GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Estrategia: Cache first, network fallback
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si está en caché, devolverlo
        if (response) {
          return response;
        }

        // Si no está en caché, intentar obtenerlo de la red
        return fetch(event.request)
          .then(response => {
            // No cachear respuestas no-ok
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta
            const responseToCache = response.clone();

            // Cachear la respuesta para futuras solicitudes
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Si la red falla, devolver una página offline
            return caches.match('/index.html');
          });
      })
  );
});

// Sincronización en segundo plano
self.addEventListener('sync', event => {
  if (event.tag === 'sync-duels') {
    event.waitUntil(syncDuels());
  }
});

async function syncDuels() {
  try {
    // Aquí se puede agregar lógica para sincronizar duelos pendientes
    console.log('Sincronizando duelos...');
  } catch (error) {
    console.error('Error al sincronizar duelos:', error);
  }
}

// Notificaciones push
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Aventuras Numéricas';
  const options = {
    body: data.body || 'Tienes un nuevo desafío',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%23080c1a" width="192" height="192"/><circle cx="96" cy="96" r="88" stroke="%234c90ff" stroke-width="4" fill="rgba(76,144,255,0.1)"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="100" fill="%234c90ff" font-family="Orbitron" font-weight="900">∑</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect fill="%234c90ff" width="96" height="96"/><text x="48" y="48" text-anchor="middle" dominant-baseline="middle" font-size="60" fill="white">∑</text></svg>',
    tag: data.tag || 'aventuras-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Clic en notificación
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
