import { db } from "@/lib/db";
import { getDemoUser } from "@/server/demo-user";
import { dayKey, formatTenggat, sisaWaktu } from "@/lib/waktu";
import KalenderTugas, { type ItemKal } from "@/components/tugas/KalenderTugas";
import { redirect } from "next/navigation"; // <-- TAMBAH IMPORT

export const dynamic = "force-dynamic";

export default async function KalenderPage() {
  const user = await getDemoUser();

  // TAMBAH GUARD CLAUSE INI
  if (!user) redirect("/login");

  const now = new Date();
  const tugas = await db.task.findMany({
    where: { userId: user.id, parentId: null, dueAt: { not: null } },
    orderBy: { dueAt: "asc" },
  });

  const items: ItemKal[] = tugas.map((t) => ({
    id: t.id,
    judul: t.title,
    key: dayKey(t.dueAt!),
    jam: formatTenggat(t.dueAt!),
    selesai: t.status === "DONE",
    sisa: sisaWaktu(t.dueAt!, now),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">
          <span className="judul-stabilo">Kalender tugas</span>
        </h1>
        <p className="mt-1 text-base text-muted">
          Semua deadline dalam satu tampilan.
        </p>
      </div>
      <KalenderTugas items={items} hariIni={dayKey(now)} />
    </div>
  );
}
