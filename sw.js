/* Talaba Studio — Service Worker (100% oflayn ishlash uchun kesh) */
const CACHE_NAME = 'talaba-studio-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './fonts/manrope-latin-ext-wght-normal.woff2',
  './fonts/manrope-latin-wght-normal.woff2',
  './vendor/docx.iife.js',
  './vendor/pptxgen.bundle.js',
  './js/utils.js',
  './js/storage.js',
  './js/model.js',
  './js/export.js',
  './js/editor-doc.js',
  './js/editor-slides.js',
  './js/pages.js',
  './js/app.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

