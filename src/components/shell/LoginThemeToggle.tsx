"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

export default function LoginThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Cek tema saat ini dari localStorage atau sistem
    const saved = localStorage.getItem("tema");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const isCurrentlyDark = saved === "gelap" || (!saved && prefersDark);

    setIsDark(isCurrentlyDark);
    document.documentElement.dataset.theme = isCurrentlyDark ? "dark" : "light";
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? "terang" : "gelap";
    setIsDark(!isDark);
    localStorage.setItem("tema", newTheme);
    document.documentElement.dataset.theme = isDark ? "light" : "dark";
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Ganti Tema"
      className="fixed top-4 right-4 z-50 grid size-10 place-items-center rounded-xl border-2 border-[color:var(--line)] bg-[color:var(--card)] text-ink shadow-[0_3px_0_var(--sh)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
    >
      {isDark ? (
        // Ikon Matahari (kalau lagi gelap, tombolnya nunjukin matahari buat terang)
        <Icon name="sparkle" className="size-5" />
      ) : (
        // Ikon Bulan (kalau lagi terang, tombolnya nunjukin bulan buat gelap)
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
