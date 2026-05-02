// traces — minimal service worker
// Strategy:
//   - precache the app shell on install
//   - cache-first for hashed Next.js static assets (immutable)
//   - network-first for navigation requests, fall back to cached "/"
//   - leave Supabase / Carto / Nominatim alone (those need fresh network)
const CACHE = "traces-v3";
const SHELL = ["/", "/manifest.webmanifest", "/icon-192.png", "/apple-icon-180.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only intercept same-origin requests; let cross-origin (Supabase, Carto, OSM, sprite tiles) hit the network as-is.
  if (url.origin !== self.location.origin) return;

  // Hashed Next.js assets — cache-first (they're immutable per build hash)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE).then((c) => c.put(request, clone));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Navigations — network-first, fall back to cached "/" so offline shell shows
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((c) => c.put("/", clone));
          }
          return response;
        })
        .catch(() =>
          caches.match("/").then(
            (cached) =>
              cached ||
              new Response("Offline", { status: 503, statusText: "Offline" }),
          ),
        ),
    );
    return;
  }

  // Other same-origin GETs (icons, manifest, public files) — stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    }),
  );
});
