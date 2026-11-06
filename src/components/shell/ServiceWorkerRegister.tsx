"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // Kalau ada SW baru, langsung aktif dan force reload
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "activated" && navigator.serviceWorker.controller) {
              // Kasih tau user buat reload, atau force reload
              window.location.reload();
            }
          });
        });
      })
      .catch((err) => {
        console.error("[sw] Gagal register:", err);
      });
  }, []);

  return null;
}
