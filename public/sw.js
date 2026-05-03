// traces — service worker (v5)
// Strategy:
//   - never intercept /sw.js itself (lets future versions install)
//   - precache the app shell on install
//   - cache-first for hashed Next.js static assets (immutable per build)
//   - network-first for navigation, fall back to cached "/"
//   - leave Supabase / Carto / Nominatim alone (cross-origin)
//   - on activate, wipe old caches and tell open clients to reload
const CACHE = "traces-20260503011257";
const SHELL = ["/", "/manifest.webmanifest", "/icon-192.png", "/apple-icon-180.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}),
  );
  // Don't skipWaiting — wait for clients to be told to reload
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
      // Notify open clients (PWA windows) so they reload to pick up new chunks
      const clientList = await self.clients.matchAll({ type: "window" });
      for (const client of clientList) {
        client.postMessage({ type: "SW_ACTIVATED", cache: CACHE });
      }
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING" || event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // CRITICAL: never intercept /sw.js itself, or future SW updates can't land
  if (url.pathname === "/sw.js") return;

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

  // Navigations — network-first, fall back to cached "/"
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
