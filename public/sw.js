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

// Listen for background push notifications
self.addEventListener("push", (event) => {
  let data = { title: "Chugli", body: "New message received!" };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (err) {
      data = { title: "Chugli", body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    data: data.data || {},
    tag: data.tag || "chugli-notification",
    vibrate: [100, 50, 100],
    actions: data.actions || [],
  };

  // Set app icon badge count if sent in push data
  if (data.badgeCount !== undefined) {
    const count = parseInt(data.badgeCount) || 0;
    if ("setAppBadge" in self.navigator) {
      self.navigator.setAppBadge(count).catch(() => {});
    } else if (self.registration && "setAppBadge" in self.registration) {
      self.registration.setAppBadge(count).catch(() => {});
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks (redirect to Together or Chat interface)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const isTogether = data.type === "together_invite" || !!data.roomId;

  const targetUrl = isTogether
    ? `/?workspace=together${data.roomId ? `&joinRoom=${encodeURIComponent(data.roomId)}` : ""}`
    : `/?workspace=chat`;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          // Send message to active window to update state immediately
          client.postMessage({
            type: "NAVIGATE_WORKSPACE",
            workspace: isTogether ? "together" : "chat",
            roomId: data.roomId,
          });

          if ("focus" in client) {
            if ("navigate" in client) {
              client.navigate(targetUrl);
            }
            return client.focus();
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
