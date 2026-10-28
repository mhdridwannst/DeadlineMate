import { cache } from "react";
import { db } from "@/lib/db";
import { dayKey } from "@/lib/waktu";

export const ambilRingkasan = cache(async (userId: string) => {
  const semua = await db.task.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      category: true,
      parentId: true,
      status: true,
      dueAt: true,
      doneAt: true,
    },
  });

  const now = new Date();
  const hariIni = dayKey(now);
  const selesai = semua.filter((t) => t.status === "DONE" && t.doneAt);

  const perHari: Record<string, number> = {};
  for (const t of selesai) {
    const k = dayKey(t.doneAt!);
    perHari[k] = (perHari[k] ?? 0) + 1;
  }

  // ================= GAMIFICATION LOGIC =================
  type Kejadian = { waktu: number; ok: boolean; hari: string };
  const kejadian: Kejadian[] = [];

  let totalExp = 0;

  for (const t of semua) {
    // Kita hanya hitung tugas induk (bukan sub-langkah) untuk EXP & Streak
    if (t.parentId !== null || !t.dueAt) continue;

    if (t.status === "DONE" && t.doneAt) {
      const tepatWaktu = t.doneAt <= t.dueAt;
      kejadian.push({
        waktu: t.doneAt.getTime(),
        ok: tepatWaktu,
        hari: dayKey(t.doneAt),
      });

      // EXP REWARD: Tepat waktu (+15), Telat (+5)
      totalExp += tepatWaktu ? 15 : 5;
    } else if (t.status !== "DONE" && t.dueAt < now) {
      // Tugas yang telat (belum selesai)
      kejadian.push({
        waktu: t.dueAt.getTime(),
        ok: false,
        hari: dayKey(t.dueAt),
      });

      // EXP PENALTY: Telat (-5)
      totalExp -= 5;
    }
  }

  // Pastikan EXP gak minus
  const exp = Math.max(0, totalExp);

  // STREAK LOGIC dengan NYAWA (Shields)
  kejadian.sort((a, b) => a.waktu - b.waktu);

  let streak = 0;
  let rekor = 0;
  let nyawa = 2; // Default 2 Nyawa

  for (const k of kejadian) {
    if (k.ok) {
      streak += 1;
      rekor = Math.max(rekor, streak);
    } else {
      // Kalau telat, kurangi nyawa. Kalau nyawa habis, streak reset.
      nyawa -= 1;
      if (nyawa < 0) {
        streak = 0;
        nyawa = 2; // Reset nyawa buat kesempatan berikutnya
      }
    }
  }

  const hariSukses = [
    ...new Set(kejadian.filter((k) => k.ok).map((k) => k.hari)),
  ];

  const induk = semua.filter((t) => t.parentId === null);
  const indukAktif = induk.filter((t) => t.status !== "DONE");
  const lewatList = indukAktif.filter((t) => t.dueAt && t.dueAt < now);
  const indukSelesaiHariIni = induk.filter(
    (t) => t.status === "DONE" && t.doneAt && dayKey(t.doneAt) === hariIni,
  ).length;

  const perKategori = ["Kuliah", "Organisasi", "Pribadi"].map((kat) => {
    const daftar = induk.filter(
      (item) => (item.category || "Kuliah").toLowerCase() === kat.toLowerCase(),
    );
    const beres = daftar.filter((item) => item.status === "DONE").length;
    return { kat, total: daftar.length, beres };
  });

  const aktifBerTenggat = indukAktif
    .filter((t) => t.dueAt !== null)
    .sort((a, b) => a.dueAt!.getTime() - b.dueAt!.getTime())
    .slice(0, 15)
    .map((t) => ({
      id: t.id,
      title: t.title,
      dueAt: t.dueAt!,
    }));

  return {
    today: hariIni,
    streak,
    rekor,
    nyawa, // <-- Kirim nyawa ke UI
    exp,
    level: Math.floor(exp / 100) + 1,
    expLevel: exp % 100,
    totalSelesai: selesai.length,
    hariSukses,
    perHari,
    perKategori,
    aktifBerTenggat,
    hariIniSelesai: indukSelesaiHariIni,
    hariIniTotal: indukAktif.length + indukSelesaiHariIni,
    terlewat: lewatList[0]
      ? { id: lewatList[0].id, judul: lewatList[0].title }
      : null,
  };
});
