/* Service worker: network-first (fresh scores) with offline cache fallback. */
const CACHE = "wcpool-v2";
const CORE = [
  "./", "./index.html", "./group-stage.html", "./results.json",
  "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-180.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;   // fonts, Google, APIs, Cloudflare: straight to network

  // network-first: always try the network so updates + fresh results.json win; fall back to cache offline
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then(m => m || caches.match("./index.html")))
  );
});
