/**
 * Jembatan service worker
 * - Precaches icons
 * - Network-first for document navigations only
 * - Offline navigations fall back to /{locale}/offline
 *
 * Important: do NOT intercept /_next/* or RSC/fetch requests.
 * Returning undefined from respondWith causes:
 * "Failed to convert value to 'Response'".
 */

const CACHE_NAME = "jembatan-v2";
const PRECACHE_URLS = [
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function offlineFallback(url) {
  const locale = url.pathname.startsWith("/en") ? "en" : "id";
  const match =
    (await caches.match(`/${locale}/offline`)) ||
    (await caches.match("/id/offline"));
  if (match) {
    return match;
  }
  return new Response(
    "<!doctype html><title>Offline</title><p>Offline — open Study once while online.</p>",
    {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

async function networkFirstNavigation(request, url) {
  try {
    const response = await fetch(request);
    // Cache successful HTML navigations for offline reopen.
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return offlineFallback(url);
  }
}

async function cacheFirstIcons(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 503, statusText: "Offline" });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // Let Next.js / Auth.js handle their own traffic (RSC, HMR, API).
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.includes(".")
  ) {
    // Icons are the only dotted path we manage.
    if (url.pathname.startsWith("/icons/")) {
      event.respondWith(cacheFirstIcons(request));
    }
    return;
  }

  // Document navigations only — never intercept fetch()/RSC.
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request, url));
  }
});
