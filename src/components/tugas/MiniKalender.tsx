"use client";

import { bangunBulan } from "@/lib/kalender";
import type { Lang } from "@/lib/i18n";

const HURUF_ID = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const HURUF_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MiniKalender({
  tahun,
  bulan0,
  lang = "id",
  hariIni,
  titik,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: {
  tahun: number;
  bulan0: number;
  lang?: Lang;
  hariIni: string;
  titik: string[];
  selectedDate?: string | null;
  onSelectDate?: (date: string | null) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
}) {
  const sel = bangunBulan(tahun, bulan0);
  const adaTugas = new Set(titik);
  const locale = lang === "en" ? "en-US" : "id-ID";
  const namaBulan = new Intl.DateTimeFormat(locale, { month: "long" }).format(
    new Date(tahun, bulan0, 1),
  );
  const hurufHari = lang === "en" ? HURUF_EN : HURUF_ID;

  return (
    <section
      className="kartu p-4"
      aria-label={`${lang === "en" ? "Calendar" : "Kalender"} ${namaBulan} ${tahun}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-extrabold text-ink">
          {namaBulan} {tahun}
        </h2>

        {/* Tombol Navigasi Bulan */}
        <div className="flex items-center gap-1">
          {selectedDate && (
            <button
              onClick={() => onSelectDate?.(null)}
              className="text-[10px] font-extrabold text-biru hover:underline px-2"
            >
              {lang === "en" ? "Reset" : "Atur ulang"}
            </button>
          )}
          <button
            onClick={onPrevMonth}
            aria-label={lang === "en" ? "Previous month" : "Bulan sebelumnya"}
            className="grid size-7 place-items-center rounded-lg border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] text-ink hover:bg-lime transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={onNextMonth}
            aria-label={lang === "en" ? "Next month" : "Bulan berikutnya"}
            className="grid size-7 place-items-center rounded-lg border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] text-ink hover:bg-lime transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
        {hurufHari.map((h) => (
          <span key={h} className="pb-1.5 text-xs font-extrabold text-muted">
            {h}
          </span>
        ))}
        {sel.map((s, i) =>
          s ? (
            <button
              key={s.key}
              onClick={() =>
                onSelectDate?.(s.key === selectedDate ? null : s.key)
              }
              className={`relative mx-auto grid size-9 place-items-center rounded-lg text-xs font-bold transition-all ${
                s.key === selectedDate
                  ? "border-2 border-[#111] bg-[color:var(--bahaya)] text-white shadow-[0_2px_0_var(--sh)] scale-110 z-10"
                  : s.key === hariIni
                    ? "border-2 border-[color:var(--line)] bg-lime font-extrabold text-[#111310]"
                    : "text-ink hover:bg-[color:var(--surface-2)]"
              }`}
            >
              {s.tgl}
              {adaTugas.has(s.key) && (
                <span
                  aria-label={lang === "en" ? "Has a deadline" : "Ada tenggat"}
                  className={`absolute bottom-0.5 size-1.5 rounded-full ${
                    s.key === selectedDate
                      ? "bg-white"
                      : "bg-[color:var(--warn-line)]"
                  }`}
                />
              )}
            </button>
          ) : (
            <span key={`k${i}`} />
          ),
        )}
      </div>
    </section>
  );
}
