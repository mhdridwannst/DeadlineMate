import { db } from "@/lib/db";
import { getBahasa, getDemoUser } from "@/server/demo-user";
import { dayKey, ZONA } from "@/lib/waktu";
import KalenderTugas, { type ItemKal } from "@/components/tugas/KalenderTugas";
import { DICT, type Lang } from "@/lib/i18n";
import { redirect } from "next/navigation"; // <-- TAMBAH IMPORT

export const dynamic = "force-dynamic";

function formatSisa(dueAt: Date, now: Date, lang: Lang) {
  const selisih = dueAt.getTime() - now.getTime();
  const menitTotal = Math.max(1, Math.round(Math.abs(selisih) / 60_000));
  const durasi =
    menitTotal < 60
      ? `${menitTotal} ${lang === "en" ? "min" : "menit"}`
      : menitTotal < 48 * 60
        ? `${Math.floor(menitTotal / 60)} ${lang === "en" ? "hr" : "jam"}`
        : `${Math.floor(menitTotal / (60 * 24))} ${lang === "en" ? "days" : "hari"}`;

  if (selisih < 0) {
    return lang === "en" ? `Overdue by ${durasi}` : `Terlambat ${durasi}`;
  }
  return lang === "en" ? `${durasi} left` : `${durasi} lagi`;
}

export default async function KalenderPage() {
  const [user, lang] = await Promise.all([getDemoUser(), getBahasa()]);

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
    jam: new Intl.DateTimeFormat(lang === "en" ? "en-US" : "id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: ZONA,
    }).format(t.dueAt!),
    selesai: t.status === "DONE",
    sisa: formatSisa(t.dueAt!, now, lang),
  }));

  const teks = DICT[lang];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">
          <span className="judul-stabilo">{teks.calendarTitle}</span>
        </h1>
        <p className="mt-1 text-base text-muted">{teks.calendarDescription}</p>
      </div>
      <KalenderTugas items={items} hariIni={dayKey(now)} lang={lang} />
    </div>
  );
}
