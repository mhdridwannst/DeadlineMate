import { cache } from "react";
import { db } from "@/lib/db";
import { dayKey } from "@/lib/waktu";

export const ambilRingkasan = cache(async (userId: string) => {
  const semua = await db.task.findMany({
    where: { userId },
    select: { parentId: true, status: true, dueAt: true, doneAt: true },
  });

  const now = new Date();
  const hariIni = dayKey(now);
  const selesai = semua.filter((t) => t.status === "DONE" && t.doneAt);

  const perHari: Record<string, number> = {};
  for (const t of selesai) {
    const k = dayKey(t.doneAt!);
    perHari[k] = (perHari[k] ?? 0) + 1;
  }

  // Streak = tugas induk beruntun yang selesai sebelum tenggat.
  // Selesai telat, atau tenggat lewat tanpa selesai, memutus streak.
  type Kejadian = { waktu: number; ok: boolean; hari: string };
  const kejadian: Kejadian[] = [];
  for (const t of semua) {
    if (t.parentId !== null || !t.dueAt) continue;
    if (t.status === "DONE" && t.doneAt) {
      kejadian.push({
        waktu: t.doneAt.getTime(),
        ok: t.doneAt <= t.dueAt,
        hari: dayKey(t.doneAt),
      });
    } else if (t.status !== "DONE" && t.dueAt < now) {
      kejadian.push({
        waktu: t.dueAt.getTime(),
        ok: false,
        hari: dayKey(t.dueAt),
      });
    }
  }
  kejadian.sort((a, b) => a.waktu - b.waktu);

  let streak = 0;
  let rekor = 0;
  for (const k of kejadian) {
    streak = k.ok ? streak + 1 : 0;
    rekor = Math.max(rekor, streak);
  }
  const hariSukses = [
    ...new Set(kejadian.filter((k) => k.ok).map((k) => k.hari)),
  ];

  const exp = selesai.length * 10;
  const induk = semua.filter((t) => t.parentId === null);
  const indukAktif = induk.filter((t) => t.status !== "DONE").length;
  const indukSelesaiHariIni = induk.filter(
    (t) => t.status === "DONE" && t.doneAt && dayKey(t.doneAt) === hariIni,
  ).length;

  return {
    today: hariIni,
    streak,
    rekor,
    exp,
    level: Math.floor(exp / 100) + 1,
    expLevel: exp % 100,
    totalSelesai: selesai.length,
    hariSukses,
    perHari,
    hariIniSelesai: indukSelesaiHariIni,
    hariIniTotal: indukAktif + indukSelesaiHariIni,
  };
});
