const CACHE_NAME = "marhaba-pwa-v5";
const SHELL_URLS = [
  "/offline",
  "/manifest.json",
  "/brand/app-icon-192.png",
  "/brand/app-icon-512.png",
  "/brand/emblem-only.png",
  "/brand/emblem-only-dark.png",
  "/icons/icon-192.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {})
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

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Never intercept mutations, API endpoints, Next.js RSC payloads, or cross-origin requests
  if (
    req.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.searchParams.has("_rsc")
  ) {
    return;
  }

  // Stale-while-revalidate for static images, logos, and brand assets
  if (
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/brand/") ||
    url.pathname.startsWith("/logos/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        const networkPromise = fetch(req)
          .then((res) => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => null);
        return cached || (await networkPromise) || new Response("", { status: 404 });
      })
    );
    return;
  }

  // Network-first for Next.js static chunks & page navigations (prevents stale chunk errors after rebuilds)
  if (url.pathname.startsWith("/_next/static/") || req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok && req.mode === "navigate") {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          if (req.mode === "navigate") {
            const offlinePage = await caches.match("/offline");
            if (offlinePage) return offlinePage;
          }
          return new Response("Offline", { status: 503 });
        })
    );
  }
});
