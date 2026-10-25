import AppShell from "@/components/shell/AppShell";
import { db } from "@/lib/db";
import { ambilRingkasan } from "@/lib/stats";
import { getDemoUser } from "@/server/demo-user";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getDemoUser();
  const now = new Date();

  const [r, terlewat] = await Promise.all([
    ambilRingkasan(user.id),
    db.task.findFirst({
      where: {
        userId: user.id,
        parentId: null,
        status: { not: "DONE" },
        dueAt: { lt: now, gte: new Date(now.getTime() - 48 * 3_600_000) },
      },
      orderBy: { dueAt: "desc" },
      select: { id: true, title: true },
    }),
  ]);

  const demo =
    process.env.NODE_ENV !== "production" || process.env.DEMO_MODE === "1";

  return (
    <AppShell
      nama={user.name ?? "Wan"}
      streak={r.streak}
      level={r.level}
      exp={r.expLevel}
      hariIni={{ selesai: r.hariIniSelesai, total: r.hariIniTotal }}
      terlewat={terlewat ? { id: terlewat.id, judul: terlewat.title } : null}
      demo={demo}
    >
      {children}
    </AppShell>
  );
}
