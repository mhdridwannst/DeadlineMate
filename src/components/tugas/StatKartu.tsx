function Bar({ pct, warna }: { pct: number; warna: string }) {
  return (
    <div className="mt-2 h-3 overflow-hidden rounded-full border-2 border-ink bg-card">
      <div className="h-full" style={{ width: `${pct}%`, background: warna }} />
    </div>
  );
}

type P = {
  streak: number;
  rekor: number;
  level: number;
  exp: number;
  selesai: number;
  total: number;
};

export default function StatKartu({
  streak,
  rekor,
  level,
  exp,
  selesai,
  total,
}: P) {
  const pctHari = total ? Math.round((selesai / total) * 100) : 0;
  const ikon =
    "grid size-12 shrink-0 place-items-center rounded-xl border-2 border-ink bg-card text-xl";
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <section
        className="kartu flex items-center gap-4 p-5"
        style={{ background: "var(--lime-soft)" }}
      >
        <span className={ikon}>🔥</span>
        <div>
          <p className="text-sm text-muted">Streak aktif</p>
          <p className="text-lg font-bold">{streak} hari beruntun</p>
          <p className="text-sm text-muted">Rekor: {rekor}</p>
        </div>
      </section>
      <section className="kartu flex items-center gap-4 p-5">
        <span
          className={`${ikon} text-base font-extrabold`}
          style={{ color: "var(--biru)" }}
        >
          L{level}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">Level &amp; EXP</p>
          <p className="text-lg font-bold">
            Lvl {level} · {exp} EXP
          </p>
          <Bar pct={exp} warna="var(--biru)" />
        </div>
      </section>
      <section className="kartu flex items-center gap-4 p-5">
        <span
          className={`${ikon} bg-lime text-[#111]`}
          style={{ background: "var(--lime)" }}
        >
          ✓
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">Hari ini</p>
          <p className="text-lg font-bold">
            {selesai}/{total} selesai
          </p>
          <Bar pct={pctHari} warna="var(--lime)" />
        </div>
      </section>
    </div>
  );
}
