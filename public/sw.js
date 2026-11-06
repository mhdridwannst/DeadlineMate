// public/sw.js
const VERSION = "v3.0.2"; // Naikin versi biar cache lama kehapus

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// ==================== FETCH EVENT (ANTI-EXTENSION CRASH) ====================
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. TAMENG UTAMA: Abaikan request dari luar http/https (misal chrome-extension://)
  // Tanpa ini, Cache API bakal crash dan bikin login gagal.
  if (!url.protocol.startsWith("http")) return;

  // 2. JANGAN CACHE API, AUTH, DAN RSC (DATA DINAMIS)
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/forgot-password") ||
    url.pathname.startsWith("/reset-password") ||
    url.searchParams.has("_rsc") ||
    event.request.method !== "GET"
  ) {
    return; // Biarin browser handle secara normal (Network only)
  }

  // 3. CACHE HANYA ASET STATIS KITA SENDIRI
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|css|js|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return (
          cached ||
          fetch(event.request).then((response) => {
            // Pastiin response statusnya OK (200) sebelum di-cache
            if (
              !response ||
              response.status !== 200 ||
              response.type !== "basic"
            ) {
              return response;
            }
            const clone = response.clone();
            caches
              .open(VERSION)
              .then((cache) => cache.put(event.request, clone));
            return response;
          })
        );
      }),
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

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.icon,
      tag: data.tag,
      data: { url: data.url },
      vibrate: [200, 100, 200],
      requireInteraction: data.tag === "overdue",
    }),
  );
});

// ==================== NOTIFICATION CLICK ====================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
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
      }),
  );
});
