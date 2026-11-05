"use client";

import { useEffect } from "react";
import { useTema } from "./tema";

export default function ThemeColorSync() {
  const [tema] = useTema();

  useEffect(() => {
    const isDark =
      tema === "gelap" ||
      (tema === "sistem" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    const color = isDark ? "#111315" : "#ffffff";

    // Hapus semua meta theme-color lama (kalau ada duplikat)
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((el) => el.remove());

    // Bikin meta baru
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = color;
    document.head.appendChild(meta);
  }, [tema]);

  return null;
}
