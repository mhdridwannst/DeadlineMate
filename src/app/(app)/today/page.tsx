import { db } from "@/lib/db";
import { getDemoUser } from "@/server/demo-user";
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
import DaftarTugas, { type Item } from "@/components/tugas/DaftarTugas";
import StatKartu from "@/components/tugas/StatKartu";
import MiniKalender from "@/components/tugas/MiniKalender";
import PomodoroMini from "@/components/tugas/PomodoroMini";

export const dynamic = "force-dynamic";

const BOBOT = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;
const HURUF_HARI = ["M", "S", "S", "R", "K", "J", "S"];
const waktu = (d: Date | null) => (d ? d.getTime() : 8.64e15);
const fmtMenit = (m: number) =>
  m < 60 ? `${m} menit` : `${Math.ceil(m / 60)} jam`;

function pesanDefaultMate(
  tone: "SANTAI" | "TEGAS" | "SUPPORTIVE",
  judulTerdekat: string | undefined,
  jumlahAktif: number,
) {
  if (jumlahAktif === 0) {
    return "Semua target hari ini sudah bersih. Tambahkan jadwal kuliah berikutnya lewat tombol Tugas baru agar tetap terukur.";
  }
  if (tone === "TEGAS") {
    return `Jangan ditunda lagi. Fokus kerjakan "${judulTerdekat}" sekarang minimal 25 menit sebelum tenggat makin dekat.`;
  }
  if (tone === "SANTAI") {
    return `Santai bro, nggak perlu pusing lihat ${jumlahAktif} tugas. Kita cicil "${judulTerdekat}" 10 menit pertama dulu sekarang.`;
  }
  return `Langkah kecil tetap progres! Yuk mulai cicil "${judulTerdekat}" perlahan, gunakan fitur Pecah Langkah AI bila butuh panduan.`;
}

export default async function TodayPage() {
  const user = await getDemoUser();
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

  const aktif = induk
    .filter((t) => t.status !== "DONE")
    .sort(
      (a, b) =>
        BOBOT[a.priority] - BOBOT[b.priority] ||
        waktu(a.dueAt) - waktu(b.dueAt),
    );
  const sudah = induk
    .filter((t) => t.status === "DONE")
    .sort((a, b) => waktu(b.doneAt) - waktu(a.doneAt))
    .slice(0, 10);
  const terdekat = aktif
    .filter((t) => t.dueAt && t.dueAt >= now)
    .sort((a, b) => waktu(a.dueAt) - waktu(b.dueAt))[0];
  const mendesak =
    terdekat?.dueAt &&
    terdekat.dueAt.getTime() - now.getTime() <= 48 * 3_600_000
      ? terdekat
      : null;

  const ke = (t: (typeof induk)[number], no: number): Item => {
    const menit =
      t.estimateMin ?? t.subtasks.reduce((n, s) => n + (s.estimateMin ?? 0), 0);
    return {
      id: t.id,
      no,
      judul: t.title,
      selesai: t.status === "DONE",
      prioritas: t.priority,
      kategori: t.category,
      estimasi: menit ? `≤${fmtMenit(menit)}` : null,
      estimasiJam: menit ? Math.max(1, Math.round(menit / 60)) : 2,
      tanggal: t.dueAt ? dayKey(t.dueAt) : "",
      jam: t.dueAt ? jamKey(t.dueAt) : "23:59",
      sisa: t.dueAt ? sisaWaktu(t.dueAt, now) : "Tanpa tenggat",
      tenggat: t.dueAt ? formatTenggat(t.dueAt) : "",
      telat: !!t.dueAt && t.dueAt < now,
      langkah: t.subtasks.map((s) => ({
        id: s.id,
        judul: s.title,
        selesai: s.status === "DONE",
        info: `${s.dueAt ? formatTenggat(s.dueAt) : "Tanpa tenggat"}${
          s.estimateMin ? ` · ${s.estimateMin} menit` : ""
        }`,
      })),
    };
  };

  const tanggalPanjang = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: ZONA,
  }).format(now);
  const [tahun, bulan] = r.today.split("-").map(Number);
  const titik = aktif.filter((t) => t.dueAt).map((t) => dayKey(t.dueAt!));
  const tujuhHari = Array.from({ length: 7 }, (_, i) =>
    tambahHari(r.today, i - 6),
  );
  const hariAda = new Set(r.hariSukses);

  const isiCatatanMate =
    catatan?.body ||
    pesanDefaultMate(
      user.coachTone,
      terdekat?.title ?? aktif[0]?.title,
      aktif.length,
    );

  const mate = (
    <section className="kartu-lime p-4" aria-label="Catatan Mate">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg border-2 border-[color:var(--line)] bg-lime text-xs font-extrabold text-[#111]">
            M
          </span>
          <h2 className="font-extrabold">Catatan Mate</h2>
        </div>
        <span className="rounded-full border border-[color:var(--line)] bg-card px-2.5 py-0.5 text-[11px] font-extrabold text-ink">
          {user.coachTone}
        </span>
      </div>
      <p className="mt-2.5 text-sm font-semibold leading-relaxed">
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
              {r.streak > 0 ? "Streak terancam" : "Deadline mendekat"}
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
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-muted">
                {tanggalPanjang}
              </p>
              <h1 className="text-3xl font-extrabold">
                <span className="judul-stabilo">Daftar tugas</span>
              </h1>
            </div>

            <div
              className="inline-flex rounded-xl border-2 border-[color:var(--line)] bg-card p-1 shadow-[0_2px_0_var(--sh)]"
              aria-label="Urutan daftar"
            >
              <span className="rounded-lg border-2 border-[color:var(--line)] bg-lime px-4 py-1.5 text-sm font-extrabold text-[#111]">
                Prioritas ({aktif.length})
              </span>
              <span className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold text-muted">
                Habit{" "}
                <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-extrabold text-bg">
                  segera
                </span>
              </span>
            </div>
          </div>

          <div className="lg:hidden">{mate}</div>

          {aktif.length > 0 ? (
            <DaftarTugas items={aktif.map((t, i) => ke(t, i + 1))} />
          ) : (
            <section className="kartu p-8 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl border-2 border-[color:var(--line)] bg-lime text-[#111] shadow-[0_3px_0_var(--sh)]">
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
              <p className="mt-3 text-xl font-extrabold">
                Semua tugas aktif sudah tuntas
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                Klik tombol <strong>Tugas baru</strong> untuk menambahkan target
                berikutnya atau buka daftar tugas selesai di bawah.
              </p>
            </section>
          )}

          {sudah.length > 0 && (
            <details className="kartu group">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 font-extrabold">
                <span className="flex items-center gap-2">
                  <span className="inline-block size-2.5 rounded-full bg-lime" />
                  <span>Sudah selesai ({sudah.length})</span>
                </span>
                <span className="text-xs font-bold text-muted group-open:rotate-180 transition-transform">
                  ▾
                </span>
              </summary>
              <div className="border-t-2 border-[color:var(--line)]/15 p-4">
                <DaftarTugas items={sudah.map((t, i) => ke(t, i + 1))} />
              </div>
            </details>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="hidden lg:block">{mate}</div>

          <PomodoroMini
            judulTugas={terdekat?.title ?? aktif[0]?.title ?? null}
          />

          <section className="kartu p-4" aria-label="Deadline terdekat">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-[color:var(--line)] bg-lime text-[#111]">
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
                  Deadline terdekat
                </p>
                <p className="truncate text-base font-extrabold">
                  {terdekat?.title ?? "Belum ada"}
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

          <section className="kartu p-4" aria-label="Riwayat streak">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold">Riwayat 7 Hari</h2>
              <span className="text-xs font-bold text-muted">Konsistensi</span>
            </div>
            <ul className="mt-3 grid grid-cols-7 gap-1.5 text-center">
              {tujuhHari.map((k) => {
                const aktifHari = hariAda.has(k);
                return (
                  <li
                    key={k}
                    className={`flex flex-col items-center gap-1 rounded-lg border py-2 ${
                      aktifHari
                        ? "border-[color:var(--line)] bg-lime text-[#111]"
                        : "border-[color:var(--line)]/20 bg-bg text-muted"
                    }`}
                  >
                    <span className="text-xs font-extrabold">
                      {aktifHari ? "✓" : "·"}
                    </span>
                    <span className="text-[11px] font-extrabold">
                      {HURUF_HARI[hariKe(k)]}
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
