const CACHE_NAME = 'vitalife-v3';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/storage.js',
    './js/documents.js',
    './js/health-import.js',
    './js/ai.js',
    './js/plan.js',
    './js/app.js',
    './manifest.json',
    './assets/icon.svg'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET' || e.request.url.includes('api.openai.com')) return;

    e.respondWith(
        caches.match(e.request).then(cached => {
            if (cached) return cached;
            return fetch(e.request).then(response => {
                if (response.ok && response.type === 'basic') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                }
                return response;
            });
        }).catch(() => caches.match('./index.html'))
    );
});
