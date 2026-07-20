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
    event.request.url.includes("/api/") ||
    event.request.url.includes("/socket.io/")
  ) {
    return;
  }

  // Network First Strategy: Try network, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Let it fail if offline and not in cache
        });
      })
  );
});

// Listen for badge update messages from main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SET_BADGE") {
    const count = event.data.count || 0;
    if ("setAppBadge" in self.navigator) {
      if (count > 0) {
        self.navigator.setAppBadge(count).catch(() => {});
      } else if ("clearAppBadge" in self.navigator) {
        self.navigator.clearAppBadge().catch(() => {});
      }
    } else if (self.registration && "setAppBadge" in self.registration) {
      if (count > 0) {
        self.registration.setAppBadge(count).catch(() => {});
      } else if ("clearAppBadge" in self.registration) {
        self.registration.clearAppBadge().catch(() => {});
      }
    }
  }
});
