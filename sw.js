const CACHE_NAME = "familie-v3";
const ASSETS = [
    "./index.html",
    "./css/main.css",
    "./css/menu.css",
    "./css/novel.css",
    "./css/transitions.css",
    "./css/scenes.css",
    "./js/app.js",
    "./js/engine.js",
    "./js/ui.js",
    "./js/characters.js",
    "./js/save.js",
    "./js/sound.js",
    "./js/particles.js",
    "./js/avatars.js",
    "./js/scenes.js",
    "./data/episode1.json",
    "./data/episode2.json",
    "./data/episode3.json"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
});
