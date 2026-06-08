// Middara Combat Helper V2.3C in-context defense flow service worker
// Network-first for the app shell so GitHub Pages updates are picked up, with cache fallback for table use.
const CACHE_VERSION = "v2-3c-in-context-defense-flow-2026-06-08";
const CACHE_NAME = `middara-helper-${CACHE_VERSION}`;
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-icon-192.png",
  "./icons/maskable-icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-16.png",
  "./icons/favicon-32.png",
  "./icons/favicon-48.png",
  "./icons/favicon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith("middara-helper-") && key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

function sameOrigin(request) {
  try { return new URL(request.url).origin === self.location.origin; }
  catch (err) { return false; }
}

async function putInCache(request, response) {
  if (!response || response.status !== 200 || response.type === "opaque") return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    await putInCache(request, response);
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match("./index.html");
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  await putInCache(request, response);
  return response;
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || !sameOrigin(request)) return;
  const url = new URL(request.url);
  if (request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("/index.html")) {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(cacheFirst(request));
});
