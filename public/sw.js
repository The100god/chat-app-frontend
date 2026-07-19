const CACHE_NAME = "chugli-cache-v1";
const urlsToCache = [
  "/",
  "/user.jpg"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
        console.warn("Service worker cache register warn:", err);
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Let the browser handle web socket connections and non-HTTP requests normally
  if (!event.request.url.startsWith("http")) return;

  // Do not intercept or cache development HMR resources, socket connections, or API endpoints
  if (
    event.request.url.includes("/_next/") ||
    event.request.url.includes("webpack") ||
    event.request.url.includes("/api/")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Cache the dynamically fetched response for offline viewing (except API calls)
        const isApiCall = event.request.url.includes("/api/");
        if (!isApiCall) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      });
    })
  );
});
