const CACHE_NAME = 'baby-allboys-pwa-v4';
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DATA_CACHE = `${CACHE_NAME}-data`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/reglamento.html',
  '/manifest.webmanifest',
  '/css/app-enhancements.css',
  '/js/app-enhancements.js',
  '/logo.png',
  '/franja-logo.png',
  '/fondo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-192.png',
  '/icons/maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('baby-allboys-pwa-') && !key.startsWith(CACHE_NAME))
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (shouldBypassCache(url)) {
    event.respondWith(fetch(request));
    return;
  }

  if (isDataJson(url)) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, STATIC_CACHE, '/index.html'));
    return;
  }

  if (isStaticAsset(request, url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  }
});

function shouldBypassCache(url) {
  return (
    url.pathname.startsWith('/api/') ||
    /^\/admin.*\.html$/i.test(url.pathname)
  );
}

function isDataJson(url) {
  return url.pathname.endsWith('.json') && (
    url.pathname.startsWith('/data/') ||
    /^\/(?:fixture|tabla|resultados|direcciones)_/.test(url.pathname) ||
    url.pathname === '/resultados_manual.json'
  );
}

function isStaticAsset(request, url) {
  return (
    ['image', 'style', 'script', 'font'].includes(request.destination) ||
    /\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|woff2?)$/i.test(url.pathname)
  );
}

async function networkFirst(request, cacheName, fallbackUrl = null) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const fresh = await fetch(request);
  if (fresh && fresh.ok) {
    cache.put(request, fresh.clone());
  }
  return fresh;
}

self.addEventListener('push', event => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = { title: 'Baby All Boys', body: event.data ? event.data.text() : '' };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Baby All Boys', {
      body: payload.body || 'Nuevo aviso del Baby All Boys',
      icon: payload.icon || '/icons/icon-192.png',
      badge: payload.badge || '/icons/maskable-192.png',
      data: payload.data || { url: '/' },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) return client.focus();
      }
      return clients.openWindow ? clients.openWindow(targetUrl) : null;
    })
  );
});
