"use client";

import { useEffect, useState, type ReactNode } from "react";

type Pilihan = "terang" | "gelap" | "sistem";

const OPSI: { nilai: Pilihan; label: string; ikon: ReactNode }[] = [
  {
    nilai: "terang",
    label: "Terang",
    ikon: (
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    ),
  },
  {
    nilai: "gelap",
    label: "Gelap",
    ikon: (
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    ),
  },
  {
    nilai: "sistem",
    label: "Ikuti sistem",
    ikon: (
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
      </svg>
    ),
  },
];

function terapkan(p: Pilihan) {
  const gelap =
    p === "gelap" ||
    (p === "sistem" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = gelap ? "dark" : "light";
}

export default function ThemeToggle() {
  const [pilihan, setPilihan] = useState<Pilihan>("sistem");
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem("tema");
      if (s === "terang" || s === "gelap" || s === "sistem") setPilihan(s);
    } catch {}
    setSiap(true);
  }, []);

  useEffect(() => {
    if (!siap) return;
    terapkan(pilihan);
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const f = () => pilihan === "sistem" && terapkan("sistem");
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, [pilihan, siap]);

  function pilih(p: Pilihan) {
    setPilihan(p);
    try {
      localStorage.setItem("tema", p);
    } catch {}
  }

  return (
    <div
      role="group"
      aria-label="Tampilan"
      className="inline-flex items-center gap-1 rounded-full border border-garis bg-halaman p-1"
    >
      {OPSI.map((o) => (
        <button
          key={o.nilai}
          type="button"
          onClick={() => pilih(o.nilai)}
          aria-pressed={pilihan === o.nilai}
          aria-label={o.label}
          title={o.label}
          className={`grid size-11 place-items-center rounded-full transition-colors ${
            pilihan === o.nilai
              ? "bg-pensil text-kertas"
              : "text-pensil/70 hover:bg-garis/60"
          }`}
        >
          {o.ikon}
        </button>
      ))}
    </div>
  );
}
