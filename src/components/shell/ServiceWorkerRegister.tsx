"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) {
      console.warn("[sw] Browser tidak mendukung Service Worker");
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[sw] Service Worker terdaftar:", reg.scope);
      })
      .catch((err) => {
        console.error("[sw] Gagal register Service Worker:", err);
      });
  }, []);

  return null;
}
