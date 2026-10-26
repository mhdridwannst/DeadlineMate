import { DICT, type Lang } from "@/lib/i18n";

type Props = {
  streak: number;
  rekor: number;
  level: number;
  exp: number;
  selesai: number;
  total: number;
  lang?: Lang;
};

export default function StatKartu({
  streak,
  rekor,
  level,
  exp,
  selesai,
  total,
  lang = "id",
}: Props) {
  const t = DICT[lang];
  const persenTugas = total > 0 ? Math.round((selesai / total) * 100) : 0;

  return (
    <section
      aria-label="Ringkasan Statistik"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3.5"
    >
      {/* Kartu 1: Streak (Full width di HP, 1 kolom di Desktop) */}
      <div className="kartu-lime col-span-2 flex items-center gap-3.5 p-3.5 sm:col-span-1 sm:p-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-[color:var(--line)] bg-card text-xl shadow-[0_2px_0_var(--sh)] sm:size-12">
          🔥
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-muted">{t.activeStreak}</p>
          <p className="text-lg font-extrabold leading-snug text-ink sm:text-xl">
            {streak} {t.daysInRow}
          </p>
          <p className="text-xs font-semibold text-muted">
            {t.bestRecord}: {rekor}
          </p>
        </div>
      </div>

      {/* Kartu 2: Level & EXP */}
      <div className="kartu flex items-center gap-3 p-3.5 sm:gap-3.5 sm:p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-[color:var(--line)] bg-[color:var(--surface)] font-mono text-sm font-extrabold text-biru shadow-[0_2px_0_var(--sh)] sm:size-12 sm:text-base">
          L{level}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold text-muted sm:text-xs">
            {t.levelExp}
          </p>
          <p className="text-base font-extrabold leading-snug text-ink sm:text-xl">
            Lvl {level} · {exp}
          </p>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full border-2 border-[color:var(--line)] bg-bg sm:h-2.5">
            <div
              className="h-full bg-biru transition-all duration-300"
              style={{ width: `${Math.min(100, exp)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Kartu 3: Target Hari Ini */}
      <div className="kartu flex items-center gap-3 p-3.5 sm:gap-3.5 sm:p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-[#141513] bg-lime text-lg font-extrabold text-[#111310] shadow-[0_2px_0_var(--sh)] sm:size-12 sm:text-xl">
          ✓
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold text-muted sm:text-xs">
            {t.todayTarget}
          </p>
          <p className="text-base font-extrabold leading-snug text-ink sm:text-xl">
            {selesai}/{total} {t.done}
          </p>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full border-2 border-[color:var(--line)] bg-bg sm:h-2.5">
            <div
              className="h-full bg-lime transition-all duration-300"
              style={{ width: `${persenTugas}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
