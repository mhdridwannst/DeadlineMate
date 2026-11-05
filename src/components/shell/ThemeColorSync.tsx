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

    // Update meta tag theme-color secara dinamis
    const color = isDark ? "#111315" : "#ffffff";

    let meta = document.querySelector(
      'meta[name="theme-color"]',
    ) as HTMLMetaElement | null;

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = color;
  }, [tema]);

  return null;
}
