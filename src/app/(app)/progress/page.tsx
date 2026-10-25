import { db } from "@/lib/db";
import { ambilRingkasan } from "@/lib/stats";
import { getDemoUser } from "@/server/demo-user";
import { hariKe, tambahHari } from "@/lib/waktu";
import StatKartu from "@/components/tugas/StatKartu";

export const dynamic = "force-dynamic";

const HURUF_HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default async function ProgressPage() {
  const user = await getDemoUser();
  const [r, semuaTugas] = await Promise.all([
    ambilRingkasan(user.id),
    db.task.findMany({
      where: { userId: user.id, parentId: null },
      select: { status: true, category: true, priority: true },
    }),
  ]);

  const hari = Array.from({ length: 7 }, (_, i) => tambahHari(r.today, i - 6));
  const nilai = hari.map((k) => r.perHari[k] ?? 0);
  const total7Hari = nilai.reduce((a, b) => a + b, 0);
  const maks = Math.max(3, ...nilai);

  const nilaiRapor =
    total7Hari >= 10 || r.streak >= 5
      ? {
          huruf: "A",
          predikat: "Sangat Disiplin",
          pesan: "Pertahankan ritme nyicil tugasmu minggu ini!",
        }
      : total7Hari >= 4 || r.streak >= 2
        ? {
            huruf: "B+",
            predikat: "Cukup Konsisten",
            pesan:
              "Sedikit lagi tembus Grade A! Jangan biarkan deadline lewat.",
          }
        : {
            huruf: "C",
            predikat: "Perlu Pemanasan",
            pesan:
              "Yuk pecah 1 tugas pakai AI hari ini biar nilaimu langsung naik!",
          };

  const perKategori = ["Kuliah", "Organisasi", "Pribadi"].map((kat) => {
    const daftar = semuaTugas.filter(
      (t) => (t.category || "Kuliah").toLowerCase() === kat.toLowerCase(),
    );
    const beres = daftar.filter((t) => t.status === "DONE").length;
    return { kat, total: daftar.length, beres };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">
          <span className="judul-stabilo">Progress belajarmu</span>
        </h1>
        <p className="mt-1 text-base text-muted">
          Pantau grafik mingguan, EXP, dan rapor produktivitasmu.
        </p>
      </div>

      <StatKartu
        streak={r.streak}
        rekor={r.rekor}
        level={r.level}
        exp={r.expLevel}
        selesai={r.hariIniSelesai}
        total={r.hariIniTotal}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="kartu p-5">
          <div className="flex items-center justify-between text-base">
            <p className="font-bold text-muted">Menuju Level {r.level + 1}</p>
            <p className="font-extrabold">{r.expLevel}/100 EXP</p>
          </div>
          <div className="mt-2 h-3.5 overflow-hidden rounded-full border-2 border-ink bg-bg">
            <div
              className="h-full bg-biru transition-all duration-300"
              style={{ width: `${r.expLevel}%` }}
            />
          </div>

          <div className="mt-7 flex items-center justify-between">
            <h2 className="font-extrabold">
              Grafik ketuntasan (7 hari terakhir)
            </h2>
            <span className="tag" style={{ background: "var(--lime-soft)" }}>
              Total: {total7Hari} selesai
            </span>
          </div>

          <div
            className="mt-5 grid h-52 grid-cols-7 items-end gap-2.5 rounded-xl border-2 border-ink/15 bg-bg/60 p-4 sm:gap-4"
            role="img"
            aria-label={`Selesai per hari: ${nilai.join(", ")}`}
          >
            {hari.map((k, i) => {
              const apakahHariIni = k === r.today;
              const tinggiPx = Math.max(
                12,
                Math.round((nilai[i] / maks) * 130),
              );
              return (
                <div
                  key={k}
                  className="flex flex-col items-center justify-end gap-1.5"
                >
                  <span className="text-xs font-extrabold">{nilai[i]}</span>
                  <div
                    className="w-full rounded-t-lg border-2 border-ink transition-all"
                    style={{
                      height: `${tinggiPx}px`,
                      background: nilai[i] > 0 ? "var(--lime)" : "var(--card)",
                    }}
                  />
                  <span
                    className={`text-xs font-extrabold ${
                      apakahHariIni ? "underline text-ink" : "text-muted"
                    }`}
                  >
                    {HURUF_HARI[hariKe(k)]}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <div className="space-y-4">
          <section
            className="kartu p-5"
            style={{ background: "var(--lime-soft)" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#111]/70">
                  Rapor Mingguan Mate
                </p>
                <p className="mt-1 text-xl font-extrabold text-[#111]">
                  {nilaiRapor.predikat}
                </p>
              </div>
              <span className="grid size-14 shrink-0 rotate-3 place-items-center rounded-2xl border-2 border-ink bg-card text-2xl font-extrabold text-[#d92d20] shadow-[0_3px_0_var(--sh)]">
                {nilaiRapor.huruf}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-[#111]/85">
              “{nilaiRapor.pesan}”
            </p>
          </section>

          <section className="kartu p-5">
            <h2 className="font-extrabold">Distribusi Kategori</h2>
            <ul className="mt-3 space-y-3">
              {perKategori.map((item) => {
                const persen =
                  item.total > 0
                    ? Math.round((item.beres / item.total) * 100)
                    : 0;
                return (
                  <li key={item.kat}>
                    <div className="flex justify-between text-sm font-bold">
                      <span>{item.kat}</span>
                      <span className="text-muted">
                        {item.beres}/{item.total} ({persen}%)
                      </span>
                    </div>
                    <div className="mt-1 h-2.5 overflow-hidden rounded-full border border-ink bg-bg">
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
