const CACHE_NAME = "nutrition-calculator-v1-2026-04-19";
const CACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./data/iv-master.json",
  "./data/meal-master.json",
  "./data/enteral-master.json",
  "./data/ons-master.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;

    try {
      const response = await fetch(event.request);
      if (response && response.ok) {
        const clone = response.clone();
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, clone);
      }
      return response;
    } catch (error) {
      const fallback = await caches.match("./index.html");
      if (fallback) return fallback;
      throw error;
    }
  })());
});
