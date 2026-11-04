// Service Worker DeadlineMate
// Berjalan di background, meskipun tab utama ditutup

const VERSION = "v1.0.0";
const CACHE_NAME = `deadlinemate-${VERSION}`;

// ==================== INSTALL ====================
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// ==================== ACTIVATE ====================
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// ==================== PUSH EVENT (Notif Masuk) ====================
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
      }),
  );
});
