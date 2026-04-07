// SHREDMTB Service Worker — v3
const CACHE = 'shredmtb-v3';

const CORE = [
  './index.html',
  './manifest.json',
  './icon.svg'
];

// ── Install: pre-cache core assets ──────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clear old caches ───────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for same-origin, network for CDN ──
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Let CDN requests (Leaflet, fonts) go straight to network
  // but cache them on the way back so they work offline later
  if (url.origin !== location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        }).catch(() => cached); // offline fallback to cached version
      })
    );
    return;
  }

  // Same-origin: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
