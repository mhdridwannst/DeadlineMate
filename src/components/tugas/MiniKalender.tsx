"use client";

import { bangunBulan, NAMA_BULAN } from "@/lib/kalender";

const HURUF = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export default function MiniKalender({
  tahun,
  bulan0,
  hariIni,
  titik,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: {
  tahun: number;
  bulan0: number;
  hariIni: string;
  titik: string[];
  selectedDate?: string | null;
  onSelectDate?: (date: string | null) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
}) {
  const sel = bangunBulan(tahun, bulan0);
  const adaTugas = new Set(titik);

  return (
    <section
      className="kartu p-4"
      aria-label={`Kalender ${NAMA_BULAN[bulan0]} ${tahun}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-extrabold text-ink">
          {NAMA_BULAN[bulan0]} {tahun}
        </h2>

        {/* Tombol Navigasi Bulan */}
        <div className="flex items-center gap-1">
          {selectedDate && (
            <button
              onClick={() => onSelectDate?.(null)}
              className="text-[10px] font-extrabold text-biru hover:underline px-2"
            >
              Reset
            </button>
          )}
          <button
            onClick={onPrevMonth}
            aria-label="Bulan Sebelumnya"
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
            aria-label="Bulan Berikutnya"
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
        {HURUF.map((h) => (
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
                  aria-label="ada deadline"
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
