"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Hanya register. Jangan paksa reload saat update, 
    // biar gak nabrak proses login/redirect.
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => {
        console.error("[sw] Gagal register:", err);
      });
  }, []);

  return null;
}
