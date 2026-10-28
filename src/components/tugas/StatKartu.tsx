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
      className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4"
    >
      {/* Kartu 1: Streak Aktif (Hijau Pastel Lembut sesuai Figma) */}
      <div className="kartu-lime col-span-2 flex items-center gap-3.5 p-4 sm:col-span-1">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-[color:var(--line)] bg-[color:var(--surface)] text-xl">
          🔥
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted">
            {lang === "en" ? "Active streak" : "Streak aktif"}
          </p>
          <p className="text-base font-extrabold leading-snug text-ink sm:text-lg">
            {streak} {lang === "en" ? "tasks in a row" : "tugas beruntun"}
          </p>
          <p className="text-xs text-muted">
            {t.bestRecord}: {rekor}
          </p>
        </div>
      </div>

      {/* Kartu 2: Level & EXP */}
      <div className="kartu flex items-center gap-3.5 p-4">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-[color:var(--line)] text-sm font-extrabold text-biru"
          style={{ background: "var(--biru-soft)" }}
        >
          L{level}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted">Level & EXP</p>
          <p className="text-base font-extrabold leading-snug text-ink sm:text-lg">
            Lvl {level} · {exp} EXP
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full border-[1.5px] border-[color:var(--line)] bg-[color:var(--surface)]">
            <div
              className="h-full bg-biru transition-all duration-300"
              style={{ width: `${Math.min(100, exp)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Kartu 3: Hari Ini */}
      <div className="kartu flex items-center gap-3.5 p-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-[#111] bg-lime text-lg font-extrabold text-[#111]">
          ✓
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted">
            {lang === "en" ? "Today" : "Hari ini"}
          </p>
          <p className="text-base font-extrabold leading-snug text-ink sm:text-lg">
            {selesai}/{total} {t.done}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full border-[1.5px] border-[color:var(--line)] bg-[color:var(--surface)]">
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
