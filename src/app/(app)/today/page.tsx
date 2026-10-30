import { db } from "@/lib/db";
import { getBahasa, getDemoUser } from "@/server/demo-user";
import { ambilRingkasan } from "@/lib/stats";
import {
  dayKey,
  formatTenggat,
  jamKey,
  sisaWaktu,
  tambahHari,
  ZONA,
} from "@/lib/waktu";
import { DICT, type Lang } from "@/lib/i18n";
import type { Item } from "@/components/tugas/DaftarTugas";
import TodayContent from "@/components/tugas/TodayContent";
import { redirect } from "next/navigation";

const BOBOT = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;
const HURUF_HARI_ID = ["M", "S", "S", "R", "K", "J", "S"];
const HURUF_HARI_EN = ["S", "M", "T", "W", "T", "F", "S"];
const waktu = (d: Date | null) => (d ? d.getTime() : 8.64e15);

function pesanDefaultMate(
  judulTerdekat: string | undefined,
  jumlahAktif: number,
  lang: Lang,
) {
  if (lang === "en") {
    if (jumlahAktif === 0)
      return "All active tasks are cleared! Type your next assignment below or click New Task.";
    return `You have ${jumlahAktif} active task(s). Start with "${judulTerdekat}" and use AI Split if you want smaller sub-steps.`;
  }
  if (jumlahAktif === 0)
    return "Semua target aktif sudah bersih! Ketik tugas berikutnya di kolom cepat atau klik Tugas baru.";
  return `Ada ${jumlahAktif} tugas aktif. Yuk cicil "${judulTerdekat}" lebih dulu—klik Pecah Langkah AI kalau ingin dibagi jadi tahap ringan.`;
}

export default async function TodayPage() {
  const [user, lang] = await Promise.all([getDemoUser(), getBahasa()]);

  if (!user) redirect("/login");
  const t = DICT[lang];
  const now = new Date();
  const nowTimestamp = now.getTime();

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

  const aktifPrisma = induk
    .filter((item) => item.status !== "DONE")
    .sort(
      (a, b) =>
        BOBOT[a.priority] - BOBOT[b.priority] ||
        waktu(a.dueAt) - waktu(b.dueAt),
    );

  const sudahPrisma = induk
    .filter((item) => item.status === "DONE")
    .sort((a, b) => waktu(b.doneAt) - waktu(a.doneAt))
    .slice(0, 10);

  const terdekatPrisma = aktifPrisma
    .filter((item) => item.dueAt && item.dueAt >= now)
    .sort((a, b) => waktu(a.dueAt) - waktu(b.dueAt))[0];

  const mendesakPrisma =
    terdekatPrisma?.dueAt &&
    terdekatPrisma.dueAt.getTime() - nowTimestamp <= 48 * 3_600_000
      ? terdekatPrisma
      : null;

  // Fungsi Mapping Data (Diperbarui biar aman untuk Client Component)
  const ke = (item: any, no: number): Item => {
    const menit =
      item.estimateMin ??
      item.subtasks.reduce((n: number, s: any) => n + (s.estimateMin ?? 0), 0);
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
      langkah: item.subtasks.map((s: any) => ({
        id: s.id,
        judul: s.title,
        selesai: s.status === "DONE",
        info: `${s.dueAt ? formatTenggat(s.dueAt) : "-"}${s.estimateMin ? ` · ${s.estimateMin} menit` : ""}`,
      })),
    };
  };

  const aktifMapped = aktifPrisma.map((item, i) => ke(item, i + 1));
  const sudahMapped = sudahPrisma.map((item, i) => ke(item, i + 1));
  const terdekatMapped = terdekatPrisma ? ke(terdekatPrisma, 0) : null;
  const mendesakMapped = mendesakPrisma ? ke(mendesakPrisma, 0) : null;

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
  const titik = aktifPrisma
    .filter((item) => item.dueAt)
    .map((item) => dayKey(item.dueAt!));
  const tujuhHari = Array.from({ length: 7 }, (_, i) =>
    tambahHari(r.today, i - 6),
  );
  const hurufHari = lang === "en" ? HURUF_HARI_EN : HURUF_HARI_ID;

  const isiCatatanMate =
    catatan?.body ||
    pesanDefaultMate(
      terdekatPrisma?.title ?? aktifPrisma[0]?.title,
      aktifPrisma.length,
      lang,
    );

  return (
    <TodayContent
      aktif={aktifMapped}
      sudah={sudahMapped}
      r={r}
      lang={lang}
      tanggalPanjang={tanggalPanjang}
      tahun={tahun}
      bulan={bulan}
      titik={titik}
      tujuhHari={tujuhHari}
      hariAda={r.hariSukses}
      hurufHari={hurufHari}
      isiCatatanMate={isiCatatanMate}
      mendesak={mendesakMapped}
      terdekat={terdekatMapped}
      now={nowTimestamp}
    />
  );
}
