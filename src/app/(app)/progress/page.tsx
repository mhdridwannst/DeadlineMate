import { db } from "@/lib/db";
import { getBahasa, getCurrentUser } from "@/lib/session";
import { ambilRingkasan } from "@/lib/stats";
import { hariKe, tambahHari } from "@/lib/waktu";
import { DICT, t as translate } from "@/lib/i18n";
import StatKartu from "@/components/tugas/StatKartu";
import { Icon } from "@/components/ui/Icon"; // <-- Tambahan import Icon
import { redirect } from "next/navigation";

const HARI_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const HARI_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function ProgressPage() {
  const [user, lang] = await Promise.all([getCurrentUser(), getBahasa()]);

  if (!user) redirect("/login");

  const t = DICT[lang];
  const r = await ambilRingkasan(user.id);

  // Ambil data untuk On-Time Rate
  const semuaTask = await db.task.findMany({
    where: { userId: user.id, parentId: null },
    select: { status: true, dueAt: true, doneAt: true },
  });

  const selesai = semuaTask.filter((t) => t.status === "DONE" && t.doneAt);
  const selesaiBertenggat = selesai.filter((t) => t.dueAt !== null);
  const tepatWaktu = selesaiBertenggat.filter((t) => t.doneAt! <= t.dueAt!);
  const onTimeRate =
    selesaiBertenggat.length > 0
      ? Math.round((tepatWaktu.length / selesaiBertenggat.length) * 100)
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
          pesan:
            lang === "en"
              ? "Excellent consistency. Keep up the momentum!"
              : "Luar biasa, kamu sangat konsisten. Pertahankan ritme ini!",
        }
      : total7Hari >= 4 || r.streak >= 2
        ? {
            huruf: "A",
            predikat: lang === "en" ? "Building Momentum" : "Makin Konsisten",
            warna: "bg-[#FFD700] text-[#111]",
            pesan:
              lang === "en"
                ? "Great work! You are getting closer to the next level."
                : "Kerja bagus! Sedikit lagi kamu mencapai level berikutnya.",
          }
        : {
            huruf: "C",
            predikat: lang === "en" ? "Warm Up" : "Pemanasan",
            warna: "bg-[color:var(--surface-2)] text-ink",
            pesan:
              lang === "en"
                ? "It is okay to start small. Complete one task today to build consistency."
                : "Tidak apa-apa memulai perlahan. Selesaikan satu tugas hari ini untuk membangun konsistensi.",
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

      {/* ================= PANEL MISI AKTIF (GAMIFIKASI BARU) ================= */}
      <section className="kartu p-5 sm:p-6 bg-card border-2 border-[color:var(--line)] shadow-[0_4px_0_var(--sh)] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#111 2px, transparent 2px)",
            backgroundSize: "16px 16px",
          }}
        ></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="grid size-8 place-items-center rounded-lg border-2 border-[color:var(--line)] bg-[color:var(--warn)] text-[color:var(--warn-ink)] shadow-[0_2px_0_var(--sh)]">
              <Icon name="target" className="size-5" />
            </span>
            <h2 className="text-lg font-black text-ink uppercase tracking-wider">
              Misi Aktif
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Misi 1: Naik Level */}
            <div className="rounded-xl border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] p-3 relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs font-black text-ink">
                    Kejar Level {r.level + 1}
                  </p>
                  <p className="text-[10px] font-bold text-muted mt-0.5">
                    Kumpulkan {100 - r.expLevel} XP lagi
                  </p>
                </div>
                <span className="text-[10px] font-black bg-[color:var(--biru-soft)] text-biru px-2 py-0.5 rounded border border-biru/30">
                  {r.expLevel}/100
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[color:var(--line)]/10 overflow-hidden">
                <div
                  className="h-full bg-biru transition-all"
                  style={{ width: `${r.expLevel}%` }}
                />
              </div>
            </div>

            {/* Misi 2: Jaga Streak */}
            <div className="rounded-xl border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] p-3 relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs font-black text-ink">
                    Pertahankan Streak
                  </p>
                  <p className="text-[10px] font-bold text-muted mt-0.5">
                    Selesaikan 1 tugas tepat waktu hari ini
                  </p>
                </div>
                <span className="text-[10px] font-black bg-[#fdba74]/20 text-[#ea580c] px-2 py-0.5 rounded border border-[#fdba74]/50 flex items-center gap-1">
                  <Icon name="flame" className="size-3" /> {r.streak} Hari
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[color:var(--line)]/10 overflow-hidden">
                <div
                  className="h-full bg-[#fdba74] transition-all"
                  style={{ width: r.hariIniSelesai > 0 ? "100%" : "15%" }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        {/* KARTU KIRI: Grafik & EXP */}
        <div className="space-y-6">
          <section className="kartu p-5 sm:p-6 bg-card border-2 border-[color:var(--line)] shadow-[0_4px_0_var(--sh)]">
            <div className="flex items-center justify-between text-sm mb-4">
              <p className="font-extrabold text-ink uppercase tracking-wider">
                {t.towardsLevel} {r.level + 1}
              </p>
              <p className="font-extrabold text-biru px-3 py-1 bg-[color:var(--biru-soft)] rounded-lg border-2 border-biru">
                {r.expLevel} / 100 XP
              </p>
            </div>
            {/* PENGgaris EXP (Physical Stationery Vibe) */}
            <div className="relative w-full h-10 border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] rounded-xl overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.05),0_3px_0_var(--sh)] mb-2 mt-2">
              {/* Isi Stabilo (Lime) */}
              <div
                className="absolute top-0 left-0 h-full bg-lime border-r-4 border-[color:var(--line)] transition-all duration-700 ease-out z-10"
                style={{ width: `${r.expLevel}%` }}
              />

              {/* Garis-Garis Penggaris (Ticks) */}
              <div className="absolute inset-0 flex justify-between items-end pb-0.5 px-2 z-20 pointer-events-none">
                {Array.from({ length: 21 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-0.5 bg-[color:var(--line)]/40 ${
                      i % 5 === 0 ? "h-4" : "h-2" // Garis panjang tiap 25%
                    }`}
                  />
                ))}
              </div>

              {/* Teks EXP di Tengah */}
              <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                <span className="text-[11px] font-black tracking-widest text-[#111] uppercase drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">
                  {r.expLevel} / 100 XP
                </span>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between border-b-2 border-[color:var(--line)]/20 pb-2">
              <h2 className="text-sm font-extrabold text-ink">
                {t.weeklyChart}
              </h2>
              <span className="rounded-full border-2 border-[#111] bg-lime px-3 py-1 text-xs font-extrabold text-[#111] shadow-[0_2px_0_var(--sh)]">
                {translate(lang, "weeklyTotalTasks", { count: total7Hari })}
              </span>
            </div>

            {/* Grafik Batang Custom */}
            <div
              className="mt-4 grid h-56 grid-cols-7 items-end gap-2 sm:gap-4"
              role="img"
              aria-label={translate(lang, "weeklyChartAccessibleLabel", {
                values: nilai.join(", "),
              })}
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
                      className={`w-full rounded-t-lg border-2 transition-all duration-300 relative ${
                        nilai[i] > 0
                          ? "border-[#111] bg-[color:var(--lime)] shadow-[0_2px_0_var(--sh)]"
                          : "border-dashed border-[color:var(--line)]/30 bg-transparent"
                      }`}
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

          {/* Ketepatan penyelesaian tugas bertenggat */}
          <section className="kartu p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5 bg-card border-2 border-[color:var(--line)] shadow-[0_4px_0_var(--sh)]">
            <div className="relative size-24 shrink-0">
              {selesaiBertenggat.length > 0 ? (
                <>
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
                </>
              ) : (
                <div className="grid size-full place-items-center rounded-full border-4 border-dashed border-[color:var(--line)]/20">
                  <span className="text-xl font-extrabold text-muted">—</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
                {lang === "en" ? "SUMMARY" : "RINGKASAN"}
              </p>
              <h3 className="text-xl font-extrabold text-ink mt-0.5">
                {t.onTimeRateTitle}
              </h3>
              <p className="text-sm text-muted mt-1 leading-snug">
                {selesaiBertenggat.length > 0
                  ? translate(lang, "onTimeRateDescription", {
                      onTime: tepatWaktu.length,
                      total: selesaiBertenggat.length,
                    })
                  : t.onTimeRateNoDataDescription}
              </p>
              {selesaiBertenggat.length > 0 && (
                <p className="mt-1 text-sm font-semibold text-muted">
                  {onTimeRate >= 80
                    ? t.onTimeRatePositive
                    : t.onTimeRateImprove}
                </p>
              )}
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
                          className="size-2 rounded-full"
                          style={{
                            backgroundColor:
                              item.kat === "Kuliah"
                                ? "var(--biru)"
                                : item.kat === "Organisasi"
                                  ? "#fdba74"
                                  : "var(--santai)",
                          }}
                        />
                        {item.kat === "Kuliah"
                          ? t.catStudy
                          : item.kat === "Organisasi"
                            ? t.catOrg
                            : t.catPersonal}
                      </span>
                      <span className="text-muted">
                        {item.beres}/{item.total} ({persen}%)
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full border-2 border-[#111] bg-[color:var(--surface-2)]">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${persen}%`,
                          backgroundColor:
                            item.kat === "Kuliah"
                              ? "var(--biru)"
                              : item.kat === "Organisasi"
                                ? "#fdba74"
                                : "var(--santai)",
                        }}
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
