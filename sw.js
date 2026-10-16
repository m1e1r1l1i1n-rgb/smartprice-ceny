const CACHE = 'smartprice-v9';
const CORE = [
'./',
'./index.html',
'./variables.css',
'./layout.css',
'./buttons.css',
'./cards.css',
'./modals.css',
'./animations.css',
'./ui-fixes.css',
'./data.js',
'./storage.js',
'./utils.js',
'./swipe.js',
'./ui.js',
'./modals.js',
'./settings.js',
'./products.js',
'./stores.js',
'./cart.js',
'./voice-search.js',
'./manifest.webmanifest',
'./icon-192.png',
'./icon-512.png',
'./logo.png'
];
self.addEventListener('install', (e) => {
e.waitUntil(
caches.open(CACHE).then((c) =>
Promise.all(CORE.map((u) => c.add(u).catch(() => {})))
).then(() => self.skipWaiting())
);
});
self.addEventListener('activate', (e) => {
e.waitUntil(
caches.keys()
.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
.then(() => self.clients.claim())
);
});
self.addEventListener('fetch', (e) => {
if (e.request.method !== 'GET') return;
e.respondWith(
caches.match(e.request).then((cached) => {
const netPromise = fetch(e.request).then((res) => {
if (res && res.ok) {
const copy = res.clone();
caches.open(CACHE).then((c) => c.put(e.request, copy));
}
return res;
}).catch(() => null);
if (cached) return cached;
return netPromise.then((res) => res || caches.match('./index.html'));
})
);
});