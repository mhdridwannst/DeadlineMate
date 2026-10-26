import { ambilRingkasan } from "@/lib/stats";
import { getBahasa, getDemoUser } from "@/server/demo-user";
import { hariKe, tambahHari } from "@/lib/waktu";
import { DICT } from "@/lib/i18n";
import StatKartu from "@/components/tugas/StatKartu";

const HARI_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const HARI_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function ProgressPage() {
  const [user, lang] = await Promise.all([getDemoUser(), getBahasa()]);
  const t = DICT[lang];
  const r = await ambilRingkasan(user.id);

  const hari = Array.from({ length: 7 }, (_, i) => tambahHari(r.today, i - 6));
  const nilai = hari.map((k) => r.perHari[k] ?? 0);
  const total7Hari = nilai.reduce((a, b) => a + b, 0);
  const maks = Math.max(3, ...nilai);
  const labelHari = lang === "en" ? HARI_EN : HARI_ID;

  const nilaiRapor =
    total7Hari >= 10 || r.streak >= 5
      ? {
          huruf: "A",
          predikat:
            lang === "en" ? "Outstanding Discipline" : "Sangat Disiplin",
          pesan:
            lang === "en"
              ? "Excellent velocity! Keep breaking down big tasks early."
              : "Pertahankan ritme nyicil tugasmu minggu ini!",
        }
      : total7Hari >= 4 || r.streak >= 2
        ? {
            huruf: "B+",
            predikat: lang === "en" ? "Consistent Pace" : "Cukup Konsisten",
            pesan:
              lang === "en"
                ? "Very close to Grade A! Don't let upcoming deadlines slip."
                : "Sedikit lagi tembus Grade A! Jangan biarkan deadline lewat.",
          }
        : {
            huruf: "C",
            predikat: lang === "en" ? "Needs Momentum" : "Perlu Pemanasan",
            pesan:
              lang === "en"
                ? "Use AI Step Splitter on 1 task today to boost your grade!"
                : "Yuk pecah 1 tugas pakai AI hari ini biar nilaimu langsung naik!",
          };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
          <span className="judul-stabilo">{t.progressTitle}</span>
        </h1>
        <p className="mt-1 text-sm text-muted">{t.progressSub}</p>
      </div>

      <StatKartu
        streak={r.streak}
        rekor={r.rekor}
        level={r.level}
        exp={r.expLevel}
        selesai={r.hariIniSelesai}
        total={r.hariIniTotal}
        lang={lang}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="kartu p-5">
          <div className="flex items-center justify-between text-sm">
            <p className="font-bold text-muted">
              {t.towardsLevel} {r.level + 1}
            </p>
            <p className="font-extrabold text-ink">{r.expLevel}/100 XP</p>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full border-2 border-[color:var(--line)] bg-bg">
            <div
              className="h-full bg-biru transition-all duration-300"
              style={{ width: `${r.expLevel}%` }}
            />
          </div>

          <div className="mt-7 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-ink">{t.weeklyChart}</h2>
            <span className="rounded-full border border-[color:var(--line)] bg-lime-soft px-3 py-1 text-xs font-extrabold text-ink">
              {t.totalDone}: {total7Hari}
            </span>
          </div>

          <div
            className="mt-4 grid h-52 grid-cols-7 items-end gap-2.5 rounded-xl border-2 border-[color:var(--line)]/20 bg-bg p-4 sm:gap-4"
            role="img"
            aria-label={`Completed per day: ${nilai.join(", ")}`}
          >
            {hari.map((k, i) => {
              const apakahHariIni = k === r.today;
              const tinggiPx = Math.max(
                10,
                Math.round((nilai[i] / maks) * 130),
              );
              return (
                <div
                  key={k}
                  className="flex flex-col items-center justify-end gap-1.5"
                >
                  <span className="text-xs font-extrabold text-ink">
                    {nilai[i]}
                  </span>
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{
                      height: `${tinggiPx}px`,
                      background: nilai[i] > 0 ? "var(--lime)" : "var(--card)",
                      border: "2px solid var(--line)",
                    }}
                  />
                  <span
                    className={`text-[11px] font-extrabold ${
                      apakahHariIni ? "text-lime underline" : "text-muted"
                    }`}
                  >
                    {labelHari[hariKe(k)]}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <div className="space-y-4">
          <section className="kartu-lime p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
                  {t.weeklyReport}
                </p>
                <p className="mt-1 text-xl font-extrabold text-ink">
                  {nilaiRapor.predikat}
                </p>
              </div>
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl border-2 border-[#141513] bg-card text-xl font-extrabold text-lime shadow-[0_2px_0_var(--sh)]">
                {nilaiRapor.huruf}
              </span>
            </div>
            <p className="mt-3 text-xs font-semibold leading-relaxed text-ink/85">
              “{nilaiRapor.pesan}”
            </p>
          </section>

          <section className="kartu p-5">
            <h2 className="text-sm font-extrabold text-ink">
              {t.categoryDist}
            </h2>
            <ul className="mt-3 space-y-3">
              {r.perKategori.map((item) => {
                const persen =
                  item.total > 0
                    ? Math.round((item.beres / item.total) * 100)
                    : 0;
                return (
                  <li key={item.kat}>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-ink">{item.kat}</span>
                      <span className="text-muted">
                        {item.beres}/{item.total} ({persen}%)
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full border border-[color:var(--line)] bg-bg">
                      <div
                        className="h-full bg-lime"
                        style={{ width: `${persen}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
