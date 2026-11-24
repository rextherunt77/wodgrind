// WODGrind offline support: the app opens without internet after the first visit.
// Network first (so a new version shows up at once when online), the saved copy when offline.
const CACHE = 'wodgrind-0.2.2';
const FILES = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon-180.png', './icons/wodgrind-icon.svg', './help/en.html', './help/fi.html'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      const net = await Promise.race([fetch(r), new Promise((_, no) => setTimeout(() => no(new Error('slow')), 4000))]);
      if (net && net.ok) c.put(r, net.clone());
      return net;
    } catch (err) {
      return (await c.match(r, { ignoreSearch: true })) || (r.mode === 'navigate' ? c.match('./index.html') : Response.error());
    }
  })());
});
