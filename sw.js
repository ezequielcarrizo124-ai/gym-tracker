const CACHE_NAME = 'gym-tracker-v7';
const ASSETS = [
  './',
  './index.html',
  './manifest_tato.json',
  './manifest_emilia.json',
  './icon_tato.png',
  './icon_emilia.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isLocal = url.origin === self.location.origin;
  const isGoogleFont = url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com');

  if (isLocal || isGoogleFont) {
    e.respondWith(
      caches.match(e.request).then(cachedResponse => {
        if (cachedResponse) {
          // Stale-While-Revalidate: serve cached version, update in background
          fetch(e.request).then(networkResponse => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => cache.put(e.request, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }
        return fetch(e.request).then(networkResponse => {
          if (networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, cacheCopy));
          }
          return networkResponse;
        });
      })
    );
  }
});
