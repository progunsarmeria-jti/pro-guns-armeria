// Service Worker para PWA Pró Guns Armeria
const CACHE_NAME = 'proguns-cache-v3';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-First com Fallback de Cache para garantir dados sempre atualizados
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Não interceptar requisições para Supabase ou APIs externas
  if (req.url.includes('supabase.co') || req.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        // Se a resposta for válida, armazena cópia no cache
        if (networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, resClone);
          });
        }
        return networkRes;
      })
      .catch(() => {
        // Fallback offline a partir do cache
        return caches.match(req).then((cachedRes) => {
          if (cachedRes) return cachedRes;
          if (req.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
  );
});
