"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/Icon";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.dataset.theme === "dark";
}

function getServerSnapshot() {
  return false;
}

export default function LoginThemeToggle() {
  const isDark = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    const savedTheme = isDark ? "terang" : "gelap";
    localStorage.setItem("tema", savedTheme);
    document.documentElement.dataset.theme = newTheme;
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      // HAPUS absolute top-4 right-4 z-50 dari sini!
      className="grid size-10 place-items-center rounded-xl border-2 border-[color:var(--line)] bg-[color:var(--card)] text-ink shadow-[0_3px_0_var(--sh)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
    >
      {isDark ? (
        <Icon name="sun" className="size-5" />
      ) : (
        <Icon name="moon" className="size-5" />
      )}
    </button>
  );
}
