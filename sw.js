// Note Checker Piano: keeps the app working offline.
// Bump VERSION whenever any file changes so phones and Macs pick up the update.
const VERSION = 'v1';
const CACHE = 'note-checker-piano-' + VERSION;
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/favicon.svg',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-1024.png',
  './icons/maskable-512.png',
  './fonts/barlow-400.woff2',
  './fonts/barlow-500.woff2',
  './fonts/barlow-600.woff2',
  './fonts/barlow-700.woff2',
  './fonts/barlow-condensed-600.woff2',
  './fonts/barlow-condensed-700.woff2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('note-checker-piano-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    // Open instantly from the saved copy, then refresh that copy in the background when online.
    const fresh = fetch(req).then(res => {
      if (res.ok) {
        const copy = res.clone();
        return caches.open(CACHE).then(c => c.put('./index.html', copy)).then(() => res);
      }
      return res;
    });
    event.respondWith(
      caches.match('./index.html').then(saved => saved || fresh).catch(() => fresh)
    );
    event.waitUntil(fresh.catch(() => {}));
    return;
  }

  event.respondWith(
    caches.match(req).then(saved => saved || fetch(req).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }))
  );
});
