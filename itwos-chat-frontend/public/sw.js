// Bump version when you want to force all clients to drop old caches (e.g. after big redesign)
const CACHE_NAME = "chat-app-cache-v4";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json"
];

// Install event - cache essential files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("[SW] Caching essential files");
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error("[SW] Cache install failed:", err);
      })
  );
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});

// Push: show system notification only when app is NOT in foreground.
// - App open & visible: we skip showNotification() so user sees in-app bell only (no duplicate).
// - App backgrounded / locked: we show system notification. iOS may also suppress in foreground.
// See frontend/docs/NOTIFICATIONS.md for full UX notes and options.
self.addEventListener("push", function (event) {
  let payload = { title: "New message", body: "", url: "/" };
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (_) {
      payload.body = event.data.text() || "You have a new message";
    }
  } else {
    payload.body = "You have a new message";
  }
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      var appInForeground = clientList.some(function (client) {
        return client.visibilityState === "visible" || client.focused;
      });
      if (appInForeground) return Promise.resolve();
      var title = payload.title || "Chat App";
      var opts = {
        body: payload.body || "You have a new message",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: payload.tag || "message",
        renotify: true,
        data: { url: payload.url || "/" },
        requireInteraction: false,
        vibrate: [200, 100, 200],
      };
      return self.registration.showNotification(title, opts).catch(function (err) {
        console.warn("[SW] showNotification failed, retry without icon/vibrate:", err);
        return self.registration.showNotification(title, {
          body: opts.body,
          tag: opts.tag,
          renotify: opts.renotify,
          data: opts.data,
          requireInteraction: false,
        });
      });
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const path = event.notification.data?.url || "/";
  const fullUrl = new URL(path, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && "focus" in client) {
          client.navigate(fullUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(fullUrl);
    })
  );
});

// App shell: always try network first so users get latest design after deploy (no stale redesign)
function isAppShellRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  return (
    request.destination === "document" ||
    request.destination === "script" ||
    request.destination === "style" ||
    path === "/" ||
    path === "/index.html" ||
    /^\/assets\/.*\.(js|css)$/.test(path)
  );
}

// Fetch event - network-first for app shell (HTML/JS/CSS), cache-first for rest
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  if (isAppShellRequest(event.request)) {
    // Network first: avoid showing old redesign when a new version is deployed
    event.respondWith(
      fetch(event.request)
        .then(fetchResponse => {
          if (fetchResponse && fetchResponse.status === 200 && fetchResponse.type === "basic") {
            const clone = fetchResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return fetchResponse;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match("/index.html")))
    );
    return;
  }

  // Cache-first for images, fonts, etc.
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(fetchResponse => {
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== "basic")
          return fetchResponse;
        const responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        return fetchResponse;
      }).catch(() => event.request.destination === "document" ? caches.match("/index.html") : undefined);
    })
  );
});
