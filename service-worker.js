/* Hisab-Khata service worker — makes the site installable & launchable offline.
   Bump CACHE_VERSION whenever you change index.html or assets so phones pick it up. */
const CACHE_VERSION = "hisab-khata-sur-v4";

// App shell that should be available offline.
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./photos/Debkumar.jpg",
  "./photos/Shibkumar.jpg",
  "./photos/Rajesh.jpg",
  "./photos/Rakesh.jpg",
  "./photos/Moumita.jpg",
  "./photos/Anindita.png",
  "./photos/Madhumita.jpg",
  "./photos/Mukulmala.png",
  "./photos/Madhu.png",
  "./photos/Himangshu.jpg",
  "./photos/Piyush.jpg"
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_VERSION).then((c) =>
      // addAll fails if any URL 404s; cache individually so one miss can't break install
      Promise.all(PRECACHE.map((url) => c.add(url).catch(() => null)))
    )
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;                 // never cache POST (writes to the Sheet)

  const url = req.url;
  // Live data from Apps Script must always come from the network — never cached.
  if (url.includes("script.google.com") || url.includes("script.googleusercontent.com")) {
    return; // let the browser handle it normally
  }

  // Everything else: network-first, fall back to cache when offline.
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
  );
});
