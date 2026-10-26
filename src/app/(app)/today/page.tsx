import { db } from "@/lib/db";
import { getBahasa, getDemoUser } from "@/server/demo-user";
import { ambilRingkasan } from "@/lib/stats";
import {
  dayKey,
  durasi,
  formatTenggat,
  hariKe,
  jamKey,
  sisaWaktu,
  tambahHari,
  ZONA,
} from "@/lib/waktu";
import { DICT, type Lang } from "@/lib/i18n";
import DaftarTugas, { type Item } from "@/components/tugas/DaftarTugas";
import InlineOmnibar from "@/components/tugas/InlineOmnibar";
import StatKartu from "@/components/tugas/StatKartu";
import MiniKalender from "@/components/tugas/MiniKalender";
import PomodoroMini from "@/components/tugas/PomodoroMini";

export const dynamic = "force-dynamic";

const BOBOT = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;
const HURUF_HARI_ID = ["M", "S", "S", "R", "K", "J", "S"];
const HURUF_HARI_EN = ["S", "M", "T", "W", "T", "F", "S"];
const waktu = (d: Date | null) => (d ? d.getTime() : 8.64e15);

function pesanDefaultMate(
  tone: "SANTAI" | "TEGAS" | "SUPPORTIVE",
  judulTerdekat: string | undefined,
  jumlahAktif: number,
  lang: Lang,
) {
  if (lang === "en") {
    if (jumlahAktif === 0) {
      return "All active tasks are cleared! Type your next assignment below or click New Task.";
    }
    if (tone === "TEGAS") {
      return `Stop postponing! Focus on "${judulTerdekat}" for at least 25 minutes right now.`;
    }
    if (tone === "SANTAI") {
      return `Take it easy bro, don't stress over ${jumlahAktif} tasks. Let's chip away at "${judulTerdekat}" for 10 minutes first!`;
    }
    return `Small steps build momentum! Start with the first sub-step of "${judulTerdekat}" today.`;
  }

  if (jumlahAktif === 0) {
    return "Semua target aktif sudah bersih! Ketik tugas berikutnya di kolom cepat bawah atau klik Tugas baru.";
  }
  if (tone === "TEGAS") {
    return `Jangan ditunda lagi! Fokus kerjakan "${judulTerdekat}" sekarang minimal 25 menit sebelum makin mepet.`;
  }
  if (tone === "SANTAI") {
    return `Santai bro, nggak perlu pusing lihat ${jumlahAktif} tugas. Kita cicil "${judulTerdekat}" 10 menit pertama dulu sekarang!`;
  }
  return `Langkah kecil tetap progres! Yuk mulai cicil "${judulTerdekat}" perlahan, gunakan Pecah Langkah AI bila butuh panduan.`;
}

export default async function TodayPage() {
  const [user, lang] = await Promise.all([getDemoUser(), getBahasa()]);
  const t = DICT[lang];
  const now = new Date();

  const [induk, catatan, r] = await Promise.all([
    db.task.findMany({
      where: { userId: user.id, parentId: null },
      include: { subtasks: { orderBy: { dueAt: "asc" } } },
    }),
    db.coachNote.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    ambilRingkasan(user.id),
  ]);

  const fmtMenit = (m: number) =>
    m < 60
      ? `${m} ${lang === "en" ? "min" : "menit"}`
      : `${Math.ceil(m / 60)} ${lang === "en" ? "hr" : "jam"}`;

  const aktif = induk
    .filter((item) => item.status !== "DONE")
    .sort(
      (a, b) =>
        BOBOT[a.priority] - BOBOT[b.priority] ||
        waktu(a.dueAt) - waktu(b.dueAt),
    );
  const sudah = induk
    .filter((item) => item.status === "DONE")
    .sort((a, b) => waktu(b.doneAt) - waktu(a.doneAt))
    .slice(0, 10);
  const terdekat = aktif
    .filter((item) => item.dueAt && item.dueAt >= now)
    .sort((a, b) => waktu(a.dueAt) - waktu(b.dueAt))[0];
  const mendesak =
    terdekat?.dueAt &&
    terdekat.dueAt.getTime() - now.getTime() <= 48 * 3_600_000
      ? terdekat
      : null;

  const ke = (item: (typeof induk)[number], no: number): Item => {
    const menit =
      item.estimateMin ??
      item.subtasks.reduce((n, s) => n + (s.estimateMin ?? 0), 0);
    return {
      id: item.id,
      no,
      judul: item.title,
      selesai: item.status === "DONE",
      prioritas: item.priority,
      kategori: item.category,
      estimasi: menit ? `≤${fmtMenit(menit)}` : null,
      estimasiJam: menit ? Math.max(1, Math.round(menit / 60)) : 2,
      tanggal: item.dueAt ? dayKey(item.dueAt) : "",
      jam: item.dueAt ? jamKey(item.dueAt) : "23:59",
      sisa: item.dueAt ? sisaWaktu(item.dueAt, now) : "Tanpa tenggat",
      tenggat: item.dueAt ? formatTenggat(item.dueAt) : "",
      telat: !!item.dueAt && item.dueAt < now,
      langkah: item.subtasks.map((s) => ({
        id: s.id,
        judul: s.title,
        selesai: s.status === "DONE",
        info: `${s.dueAt ? formatTenggat(s.dueAt) : "-"}${
          s.estimateMin ? ` · ${s.estimateMin} menit` : ""
        }`,
      })),
    };
  };

  const tanggalPanjang = new Intl.DateTimeFormat(
    lang === "en" ? "en-US" : "id-ID",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: ZONA,
    },
  ).format(now);

  const [tahun, bulan] = r.today.split("-").map(Number);
  const titik = aktif
    .filter((item) => item.dueAt)
    .map((item) => dayKey(item.dueAt!));
  const tujuhHari = Array.from({ length: 7 }, (_, i) =>
    tambahHari(r.today, i - 6),
  );
  const hariAda = new Set(r.hariSukses);
  const hurufHari = lang === "en" ? HURUF_HARI_EN : HURUF_HARI_ID;

  const isiCatatanMate =
    catatan?.body ||
    pesanDefaultMate(
      user.coachTone,
      terdekat?.title ?? aktif[0]?.title,
      aktif.length,
      lang,
    );

  const mate = (
    <section className="kartu-lime p-4" aria-label={t.mateNote}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg border-2 border-[#141513] bg-lime text-xs font-extrabold text-[#111310]">
            M
          </span>
          <h2 className="font-extrabold text-ink">{t.mateNote}</h2>
        </div>
        <span className="rounded-full border border-[color:var(--line)] bg-card px-2.5 py-0.5 text-[11px] font-extrabold text-ink">
          {user.coachTone}
        </span>
      </div>
      <p className="mt-2.5 text-sm font-semibold leading-relaxed text-ink">
        “{isiCatatanMate}”
      </p>
    </section>
  );

  return (
    <div className="space-y-6">
      {mendesak?.dueAt && (
        <section
          className="kartu flex items-start gap-4 p-4"
          style={{
            background: "var(--warn)",
            borderColor: "var(--warn-line)",
            color: "var(--warn-ink)",
            boxShadow: "0 4px 0 var(--warn-line)",
          }}
        >
          <span
            className="grid size-11 shrink-0 place-items-center rounded-xl border-2 bg-card text-lg font-extrabold text-ink"
            style={{ borderColor: "var(--warn-line)" }}
          >
            !
          </span>
          <div>
            <p className="text-base font-extrabold">
              {r.streak > 0 ? "Streak terancam!" : "Deadline mendekat!"}
            </p>
            <p className="text-sm">
              Selesaikan <strong>“{mendesak.title}”</strong> dalam{" "}
              <strong className="underline">
                {durasi(mendesak.dueAt.getTime() - now.getTime())}
              </strong>{" "}
              agar{" "}
              {r.streak > 0
                ? `streak ${r.streak} hari tidak terputus`
                : "streak mulai terhitung"}
              .
            </p>
          </div>
        </section>
      )}

      <StatKartu
        streak={r.streak}
        rekor={r.rekor}
        level={r.level}
        exp={r.expLevel}
        selesai={r.hariIniSelesai}
        total={r.hariIniTotal}
        lang={lang}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-muted">
                {tanggalPanjang}
              </p>
              <h1 className="text-3xl font-extrabold text-ink">
                <span className="judul-stabilo">{t.taskList}</span>
              </h1>
            </div>

            <div
              className="inline-flex rounded-xl border-2 border-[color:var(--line)] bg-card p-1 shadow-[0_2px_0_var(--sh)]"
              aria-label="Urutan daftar"
            >
              <span className="rounded-lg border-2 border-[#141513] bg-lime px-4 py-1.5 text-sm font-extrabold text-[#111310]">
                {t.priority} ({aktif.length})
              </span>
              <span className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold text-muted">
                Habit{" "}
                <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-extrabold text-bg">
                  {t.habitSoon}
                </span>
              </span>
            </div>
          </div>

          <InlineOmnibar lang={lang} />

          <div className="lg:hidden">{mate}</div>

          {aktif.length > 0 ? (
            <DaftarTugas items={aktif.map((item, i) => ke(item, i + 1))} />
          ) : (
            <section className="kartu p-8 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl border-2 border-[#141513] bg-lime text-[#111310] shadow-[0_3px_0_var(--sh)]">
                <svg
                  viewBox="0 0 24 24"
                  className="size-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12l5 5 9-10" />
                </svg>
              </div>
              <p className="mt-3 text-xl font-extrabold text-ink">
                {t.allDoneTitle}
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                {t.allDoneDesc}
              </p>
            </section>
          )}

          {sudah.length > 0 && (
            <details className="kartu group">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 font-extrabold text-ink">
                <span className="flex items-center gap-2">
                  <span className="inline-block size-2.5 rounded-full bg-lime" />
                  <span>
                    {t.completedTasks} ({sudah.length})
                  </span>
                </span>
                <span className="text-xs font-bold text-muted transition-transform group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <div className="border-t-2 border-[color:var(--line)]/15 p-4">
                <DaftarTugas items={sudah.map((item, i) => ke(item, i + 1))} />
              </div>
            </details>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="hidden lg:block">{mate}</div>

          <PomodoroMini
            judulTugas={terdekat?.title ?? aktif[0]?.title ?? null}
          />

          <section className="kartu p-4" aria-label={t.nearestDeadline}>
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-[#141513] bg-lime text-[#111310]">
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  {t.nearestDeadline}
                </p>
                <p className="truncate text-base font-extrabold text-ink">
                  {terdekat?.title ?? t.noneYet}
                </p>
              </div>
            </div>
            {terdekat?.dueAt && (
              <div className="mt-3 rounded-xl border border-[color:var(--line)]/20 bg-bg p-3">
                <p className="text-xl font-extrabold text-[color:var(--warn-line)]">
                  {sisaWaktu(terdekat.dueAt, now)}
                </p>
                <p className="text-xs font-semibold text-muted">
                  {formatTenggat(terdekat.dueAt)}
                </p>
              </div>
            )}
          </section>

          <MiniKalender
            tahun={tahun}
            bulan0={bulan - 1}
            hariIni={r.today}
            titik={titik}
          />

          <section className="kartu p-4" aria-label={t.consistency7d}>
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-ink">{t.consistency7d}</h2>
              <span className="text-xs font-bold text-muted">7d</span>
            </div>
            <ul className="mt-3 grid grid-cols-7 gap-1.5 text-center">
              {tujuhHari.map((k) => {
                const aktifHari = hariAda.has(k);
                return (
                  <li
                    key={k}
                    className={`flex flex-col items-center gap-1 rounded-lg border-2 py-2 ${
                      aktifHari
                        ? "border-[#141513] bg-lime text-[#111310]"
                        : "border-[color:var(--line)]/20 bg-bg text-muted"
                    }`}
                  >
                    <span className="text-xs font-extrabold">
                      {aktifHari ? "✓" : "·"}
                    </span>
                    <span className="text-[11px] font-extrabold">
                      {hurufHari[hariKe(k)]}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
