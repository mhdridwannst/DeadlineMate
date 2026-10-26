import type { ReactNode } from "react";
import { db } from "@/lib/db";
import { ambilRingkasan } from "@/lib/stats";
import { durasi } from "@/lib/waktu";
import { getBahasa, getDemoUser } from "@/server/demo-user";
import AppShell from "@/components/shell/AppShell";
import type { ItemNotif } from "@/components/shell/DeadlineNotifier";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [user, lang] = await Promise.all([getDemoUser(), getBahasa()]);
  const [r, tugasAktif] = await Promise.all([
    ambilRingkasan(user.id),
    db.task.findMany({
      where: {
        userId: user.id,
        parentId: null,
        status: { not: "DONE" },
        dueAt: { not: null },
      },
      orderBy: { dueAt: "asc" },
      take: 15,
    }),
  ]);

  const now = Date.now();
  const notifikasi: ItemNotif[] = tugasAktif.flatMap((t) => {
    if (!t.dueAt) return [];
    const selisihMs = t.dueAt.getTime() - now;
    const selisihJam = selisihMs / 3_600_000;

    if (selisihMs < 0) {
      return [
        {
          id: t.id,
          judul: t.title,
          sisaJam: selisihJam,
          labelWaktu:
            lang === "en"
              ? `${durasi(-selisihMs)} late`
              : `Telat ${durasi(-selisihMs)}`,
          status: "OVERDUE" as const,
        },
      ];
    }
    if (selisihJam <= 3) {
      return [
        {
          id: t.id,
          judul: t.title,
          sisaJam: selisihJam,
          labelWaktu: durasi(selisihMs),
          status: "URGENT_3H" as const,
        },
      ];
    }
    if (selisihJam <= 24) {
      return [
        {
          id: t.id,
          judul: t.title,
          sisaJam: selisihJam,
          labelWaktu: durasi(selisihMs),
          status: "H_MINUS_1" as const,
        },
      ];
    }
    return [];
  });

  return (
    <AppShell
      nama={user.name ?? "Wannn"}
      email={user.email}
      lang={lang}
      notifikasi={notifikasi}
      streak={r.streak}
      level={r.level}
      exp={r.expLevel}
      hariIni={{ selesai: r.hariIniSelesai, total: r.hariIniTotal }}
      terlewat={r.terlewat}
      demo={process.env.NODE_ENV !== "production"}
    >
      {children}
    </AppShell>
  );
}
