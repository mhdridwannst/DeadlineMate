// Service Worker DeadlineMate
const VERSION = "v2.0.0"; // Naikin versi biar cache lama kehapus

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// ==================== FETCH EVENT (CRITICAL FIX) ====================
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. JANGAN CACHE API & NEXT.JS DATA FETCH
  // Ini biar data selalu fresh dari server, gak bikin PWA nge-hang
  if (
    url.pathname.startsWith("/api/") ||
    url.searchParams.has("_rsc") ||
    event.request.method !== "GET"
  ) {
    return; // Biarin browser handle secara natural (Network First)
  }

  // 2. CACHE HANYA ASET STATIS (Gambar, Font, CSS, JS)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|css|js|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return (
          cached ||
          fetch(event.request).then((response) => {
            const clone = response.clone();
            caches.open(VERSION).then((cache) => cache.put(event.request, clone));
            return response;
          })
        );
      })
    );
  }
});

// ==================== PUSH EVENT ====================
self.addEventListener("push", (event) => {
  let data = {
    title: "DeadlineMate",
    body: "Ada pengingat baru buat kamu!",
    url: "/today",
    icon: "/icon-192.svg",
    badge: "/icon-192.svg",
    tag: "default",
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (e) {
    console.warn("[sw] Gagal parse push data:", e);
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: { url: data.url },
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: data.tag === "overdue",
    actions: [
      { action: "open", title: "Buka App" },
      { action: "close", title: "Tutup" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ==================== NOTIFICATION CLICK ====================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  const urlToOpen = event.notification.data?.url || "/today";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
