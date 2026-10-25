"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

const MENU = [
  { href: "/today", label: "Hari ini", segera: false },
  { href: "/tugas", label: "Semua tugas", segera: true },
  { href: "/fokus", label: "Fokus", segera: true },
  { href: "/rapor", label: "Rapor", segera: true },
];

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
      <circle
        cx="16"
        cy="16"
        r="13"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M8 21 L21 8 M8 27 L27 8 M13 27 L27 13"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        clipPath="circle(12px at 16px 16px)"
      />
    </svg>
  );
}

export default function Navbar() {
  const path = usePathname();
  const [buka, setBuka] = useState(false);

  useEffect(() => {
    if (!buka) return;
    const f = (e: KeyboardEvent) => e.key === "Escape" && setBuka(false);
    addEventListener("keydown", f);
    return () => removeEventListener("keydown", f);
  }, [buka]);

  const item = (m: (typeof MENU)[number], mobile: boolean) => {
    const aktif = path === m.href;
    const dasar = mobile
      ? "flex min-h-14 items-center justify-between rounded-lg px-3 text-lg"
      : "inline-flex items-center rounded-lg px-3 text-base";
    if (m.segera) {
      return (
        <span
          key={m.href}
          aria-disabled="true"
          className={`${dasar} cursor-not-allowed text-pensil/45`}
        >
          {m.label}
          <span className="ml-2 rounded-full border border-garis px-2 text-xs">
            segera
          </span>
        </span>
      );
    }
    return (
      <Link
        key={m.href}
        href={m.href}
        onClick={() => setBuka(false)}
        aria-current={aktif ? "page" : undefined}
        className={`${dasar} font-medium hover:bg-garis/50 ${aktif ? "font-bold" : ""}`}
      >
        <span className={aktif ? "stabilo" : ""}>{m.label}</span>
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-garis bg-kertas pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/today"
          className="flex items-center gap-2 text-pensil"
          onClick={() => setBuka(false)}
        >
          <Logo />
          <span className="text-xl font-bold tracking-tight">
            Deadline Mate
          </span>
        </Link>

        <nav aria-label="Utama" className="hidden items-center gap-1 md:flex">
          {MENU.map((m) => item(m, false))}
        </nav>

        <div className="hidden md:block">
          <ThemeToggle />
        </div>

        <button
          type="button"
          onClick={() => setBuka((b) => !b)}
          aria-expanded={buka}
          aria-controls="menu-mobile"
          aria-label={buka ? "Tutup menu" : "Buka menu"}
          className="grid size-11 place-items-center rounded-lg hover:bg-garis/50 md:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            {buka ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {buka && (
        <div
          id="menu-mobile"
          className="border-t border-garis bg-kertas px-4 pb-5 pt-2 md:hidden"
        >
          <nav aria-label="Utama" className="flex flex-col">
            {MENU.map((m) => item(m, true))}
          </nav>
          <div className="mt-3 flex items-center justify-between border-t border-garis pt-4">
            <span className="text-base font-medium">Tampilan</span>
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
