const CACHE_NAME = 'vin-comparatif-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.error('Cache install error:', err))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', event => {
  // Cache first, fallback to network
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if(response) return response;
        return fetch(event.request)
          .then(response => {
            // Ne pas cacher les réponses non-HTTP
            if(!response || response.status !== 200 || response.type === 'error') {
              return response;
            }
            // Cloner la réponse pour la mettre en cache
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            return response;
          });
      })
      .catch(() => {
        // Fallback offline - retourner une page simple
        return new Response('Hors ligne. Les données sont conservées localement.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      })
  );
});
