import { db } from "@/lib/db";
import { getBahasa, getDemoUser } from "@/server/demo-user";
import { ambilRingkasan } from "@/lib/stats";
import { hariKe, tambahHari } from "@/lib/waktu";
import { DICT } from "@/lib/i18n";
import StatKartu from "@/components/tugas/StatKartu";

const HARI_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const HARI_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function ProgressPage() {
  const [user, lang] = await Promise.all([getDemoUser(), getBahasa()]);
  const t = DICT[lang];
  const r = await ambilRingkasan(user.id);

  // Ambil data untuk On-Time Rate
  const semuaTask = await db.task.findMany({
    where: { userId: user.id, parentId: null },
    select: { status: true, dueAt: true, doneAt: true },
  });

  const selesai = semuaTask.filter((t) => t.status === "DONE" && t.doneAt);
  const tepatWaktu = selesai.filter((t) => t.dueAt && t.doneAt! <= t.dueAt);
  const onTimeRate =
    selesai.length > 0
      ? Math.round((tepatWaktu.length / selesai.length) * 100)
      : 0;

  const hari = Array.from({ length: 7 }, (_, i) => tambahHari(r.today, i - 6));
  const nilai = hari.map((k) => r.perHari[k] ?? 0);
  const total7Hari = nilai.reduce((a, b) => a + b, 0);
  const maks = Math.max(3, ...nilai);
  const labelHari = lang === "en" ? HARI_EN : HARI_ID;

  // Logika Rapor (Gamifikasi)
  const nilaiRapor =
    total7Hari >= 10 || r.streak >= 5
      ? {
          huruf: "S",
          predikat: lang === "en" ? "Untouchable" : "Luar Biasa",
          warna: "bg-[color:var(--lime)] text-[#111]",
          pesan: "Gila! Lo mesin produktivitas. Pertahankan ritme ini!",
        }
      : total7Hari >= 4 || r.streak >= 2
        ? {
            huruf: "A",
            predikat: lang === "en" ? "On Fire" : "Sedang On Fire",
            warna: "bg-[#FFD700] text-[#111]",
            pesan: "Kerja bagus! Dikit lagi tembus level dewa. Jangan kendor!",
          }
        : {
            huruf: "C",
            predikat: lang === "en" ? "Warm Up" : "Pemanasan",
            warna: "bg-[color:var(--surface-2)] text-ink",
            pesan:
              "Gak apa-apa mulai pelan. Sikat 1 tugas hari ini biar streak jalan!",
          };

  return (
    <div className="space-y-6 pb-10">
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
        {/* KARTU KIRI: Grafik & EXP */}
        <div className="space-y-6">
          <section className="kartu p-5 sm:p-6 bg-card border-2 border-[color:var(--line)] shadow-[0_4px_0_var(--sh)]">
            <div className="flex items-center justify-between text-sm mb-4">
              <p className="font-extrabold text-ink uppercase tracking-wider">
                Menuju Level {r.level + 1}
              </p>
              <p className="font-extrabold text-biru px-3 py-1 bg-[color:var(--biru-soft)] rounded-lg border-2 border-biru">
                {r.expLevel} / 100 XP
              </p>
            </div>
            {/* Progress Bar Segmented ala Game RPG */}
            <div className="flex gap-1.5 h-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 border-2 border-[#111] rounded-sm transition-all duration-500 ${
                    i < Math.floor(r.expLevel / 10)
                      ? "bg-lime shadow-[0_2px_0_var(--sh)]"
                      : "bg-[color:var(--surface-2)]"
                  }`}
                />
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between border-b-2 border-[color:var(--line)]/20 pb-2">
              <h2 className="text-sm font-extrabold text-ink">
                {t.weeklyChart}
              </h2>
              <span className="rounded-full border-2 border-[#111] bg-lime px-3 py-1 text-xs font-extrabold text-[#111] shadow-[0_2px_0_var(--sh)]">
                Total: {total7Hari} Tugas
              </span>
            </div>

            {/* Grafik Batang Custom */}
            <div
              className="mt-4 grid h-56 grid-cols-7 items-end gap-2 sm:gap-4"
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
                    className="flex flex-col items-center justify-end gap-1.5 group"
                  >
                    <span className="text-xs font-extrabold text-ink opacity-0 group-hover:opacity-100 transition-opacity">
                      {nilai[i]}
                    </span>
                    <div
                      className={`w-full rounded-t-lg border-2 border-[#111] transition-all duration-300 relative ${nilai[i] > 0 ? "bg-[color:var(--lime)] shadow-[0_2px_0_var(--sh)]" : "bg-[color:var(--surface-2)]"}`}
                      style={{ height: `${tinggiPx}px` }}
                    >
                      {apakahHariIni && (
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#111]" />
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-extrabold ${apakahHariIni ? "text-biru bg-[color:var(--biru-soft)] px-1.5 py-0.5 rounded" : "text-muted"}`}
                    >
                      {labelHari[hariKe(k)]}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* KARTU BARU: On-Time Delivery Rate */}
          <section className="kartu p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5 bg-card border-2 border-[color:var(--line)] shadow-[0_4px_0_var(--sh)]">
            <div className="relative size-24 shrink-0">
              <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className="stroke-[color:var(--surface-2)]"
                  strokeWidth="4"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className="stroke-biru transition-all duration-1000"
                  strokeWidth="4"
                  strokeDasharray="100"
                  strokeDashoffset={100 - onTimeRate}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-extrabold text-ink">
                  {onTimeRate}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
                On-Time Delivery
              </p>
              <h3 className="text-xl font-extrabold text-ink mt-0.5">
                Tingkat Ketepatan Waktu
              </h3>
              <p className="text-sm text-muted mt-1 leading-snug">
                Lo udah nyelesain <strong>{tepatWaktu.length}</strong> dari{" "}
                <strong>{selesai.length}</strong> tugas sebelum deadline.{" "}
                {onTimeRate >= 80
                  ? "Gokil, lo anti nunda-nunda tugas nih"
                  : "Yuk, mulai cicil lebih awal biar persentasenya naik!"}
              </p>
            </div>
          </section>
        </div>

        {/* KARTU KANAN: Rapor & Kategori */}
        <div className="space-y-4">
          <section
            className={`kartu p-5 border-2 border-[color:var(--line)] shadow-[0_4px_0_var(--sh)] ${nilaiRapor.warna}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider opacity-80">
                  {t.weeklyReport}
                </p>
                <p className="mt-1 text-xl font-extrabold">
                  {nilaiRapor.predikat}
                </p>
              </div>
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl border-2 border-[#111] bg-white text-3xl font-extrabold shadow-[0_3px_0_var(--sh)]">
                {nilaiRapor.huruf}
              </span>
            </div>
            <p className="mt-4 text-sm font-semibold leading-relaxed opacity-90">
              “{nilaiRapor.pesan}”
            </p>
          </section>

          <section className="kartu p-5 bg-card border-2 border-[color:var(--line)] shadow-[0_4px_0_var(--sh)]">
            <h2 className="text-sm font-extrabold text-ink mb-4">
              {t.categoryDist}
            </h2>
            <ul className="space-y-4">
              {r.perKategori.map((item) => {
                const persen =
                  item.total > 0
                    ? Math.round((item.beres / item.total) * 100)
                    : 0;
                return (
                  <li key={item.kat}>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-ink flex items-center gap-1.5">
                        <span
                          className={`size-2 rounded-full ${item.kat === "Kuliah" ? "bg-biru" : item.kat === "Organisasi" ? "bg-oranye" : "bg-santai"}`}
                        />
                        {item.kat}
                      </span>
                      <span className="text-muted">
                        {item.beres}/{item.total} ({persen}%)
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full border-2 border-[#111] bg-[color:var(--surface-2)]">
                      <div
                        className={`h-full transition-all duration-500 ${item.kat === "Kuliah" ? "bg-biru" : item.kat === "Organisasi" ? "bg-oranye" : "bg-[color:var(--santai)]"}`}
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
