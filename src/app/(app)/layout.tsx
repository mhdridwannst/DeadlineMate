import type { ReactNode } from "react";
import { ambilRingkasan } from "@/lib/stats";
import { durasi } from "@/lib/waktu";
import { getBahasa, getDemoUser } from "@/server/demo-user";
import AppShell from "@/components/shell/AppShell";
import type { ItemNotif } from "@/components/shell/DeadlineNotifier";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [user, lang] = await Promise.all([getDemoUser(), getBahasa()]);
  const r = await ambilRingkasan(user.id);

  const now = Date.now();
  const notifikasi: ItemNotif[] = r.aktifBerTenggat.flatMap((t) => {
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
    >
      {children}
    </AppShell>
  );
}
