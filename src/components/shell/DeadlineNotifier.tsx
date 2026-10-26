"use client";

import { useEffect, useRef, useState } from "react";
import { sfxAiSuccess, sfxClick } from "@/lib/sfx";
import type { Lang } from "@/lib/i18n";

export type ItemNotif = {
  id: string;
  judul: string;
  sisaJam: number;
  labelWaktu: string;
  status: "OVERDUE" | "URGENT_3H" | "H_MINUS_1";
};

export default function DeadlineNotifier({
  items,
  lang = "id",
}: {
  items: ItemNotif[];
  lang?: Lang;
}) {
  const [buka, setBuka] = useState(false);
  const [izin, setIzin] = useState<NotificationPermission | "unsupported">(
    "default",
  );
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setIzin("unsupported");
      return;
    }
    setIzin(Notification.permission);
  }, []);

  useEffect(() => {
    if (izin !== "granted" || items.length === 0) return;

    items.forEach((item) => {
      const key = `dm_notif_sent_${item.id}_${item.status}`;
      try {
        if (localStorage.getItem(key)) return;
        localStorage.setItem(key, "1");

        const title =
          item.status === "OVERDUE"
            ? lang === "en"
              ? `Overdue: ${item.judul}`
              : `Terlewat: ${item.judul}`
            : item.status === "URGENT_3H"
              ? lang === "en"
                ? `Due in ${item.labelWaktu}: ${item.judul}`
                : `Kurang ${item.labelWaktu} lagi: ${item.judul}`
              : lang === "en"
                ? `H-1 Reminder: ${item.judul}`
                : `Pengingat H-1: ${item.judul}`;

        const body =
          lang === "en"
            ? `Don't lose your streak! Complete "${item.judul}" (${item.labelWaktu}).`
            : `Jangan sampai streak putus! Cicil "${item.judul}" (${item.labelWaktu}).`;

        new Notification(title, {
          body,
          tag: key,
        });
      } catch {}
    });
  }, [izin, items, lang]);

  useEffect(() => {
    function tutupLuar(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setBuka(false);
      }
    }
    if (buka) document.addEventListener("mousedown", tutupLuar);
    return () => document.removeEventListener("mousedown", tutupLuar);
  }, [buka]);

  async function mintaIzinNotif() {
    sfxClick();
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const hasil = await Notification.requestPermission();
    setIzin(hasil);
    if (hasil === "granted") {
      sfxAiSuccess();
      new Notification(
        lang === "en"
          ? "DeadlineMate Alerts Enabled!"
          : "Notifikasi DeadlineMate Aktif!",
        {
          body:
            lang === "en"
              ? "We will remind you at H-1 (24h) and 3 hours before any deadline."
              : "Mate akan mengingatkanmu pada H-1 (24 jam) dan 3 jam sebelum deadline.",
        },
      );
    }
  }

  return (
    <div ref={popRef} className="relative">
      <button
        type="button"
        onClick={() => {
          sfxClick();
          setBuka((v) => !v);
        }}
        aria-label="Notifikasi Deadline"
        className="relative grid size-10 min-h-0 min-w-0 place-items-center rounded-xl border-2 border-[color:var(--line)] bg-card text-ink transition hover:-translate-y-0.5"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {items.length > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full border border-[#141513] bg-[color:var(--bahaya)] text-[10px] font-extrabold text-white">
            {items.length}
          </span>
        )}
      </button>

      {buka && (
        <div className="kartu fixed inset-x-3 top-16 z-50 p-4 shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-80">
          <div className="flex items-center justify-between gap-2 border-b-2 border-[color:var(--line)]/20 pb-2.5">
            <div>
              <p className="text-sm font-extrabold text-ink">
                {lang === "en" ? "Deadline Alerts" : "Pengingat Deadline"}
              </p>
              <p className="text-[11px] font-semibold text-muted">
                {lang === "en"
                  ? "H-1 (24h) & Urgent (<3h) monitor"
                  : "Pantauan otomatis H-1 & Mendesak"}
              </p>
            </div>
            {izin !== "granted" && izin !== "unsupported" ? (
              <button
                type="button"
                onClick={mintaIzinNotif}
                className="tombol tombol-kecil min-h-8 px-2.5 text-[11px]"
              >
                {lang === "en" ? "Enable Push" : "Aktifkan Push"}
              </button>
            ) : (
              <span className="rounded-full border border-[#141513] bg-lime px-2.5 py-0.5 text-[10px] font-extrabold text-[#111310]">
                {izin === "granted" ? "Push ON" : "In-App"}
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-xs font-bold text-muted">
                {lang === "en"
                  ? "No urgent deadlines within 24 hours."
                  : "Aman! Tidak ada tugas darurat dalam 24 jam ke depan."}
              </p>
            </div>
          ) : (
            <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
              {items.map((n) => (
                <li
                  key={n.id}
                  className="rounded-xl border-2 border-[color:var(--line)] bg-bg p-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                        n.status === "OVERDUE"
                          ? "bg-[color:var(--bahaya-bg)] text-[color:var(--bahaya)]"
                          : n.status === "URGENT_3H"
                            ? "bg-[color:var(--warn)] text-[color:var(--warn-ink)]"
                            : "bg-lime text-[#111310]"
                      }`}
                    >
                      {n.status === "OVERDUE"
                        ? lang === "en"
                          ? "OVERDUE"
                          : "TERLEWAT"
                        : n.status === "URGENT_3H"
                          ? lang === "en"
                            ? "URGENT <3H"
                            : "KRITIS <3 JAM"
                          : "H-1 (<24 JAM)"}
                    </span>
                    <span className="text-xs font-extrabold text-muted">
                      {n.labelWaktu}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-extrabold text-ink">
                    {n.judul}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
