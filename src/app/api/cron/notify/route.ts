import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { kirimNotifKeUser } from "@/server/push-utils";

// ==================== TIPE DATA ====================
type KategoriNotif = {
  key: "24h" | "3h" | "overdue";
  title: string;
  bodyTemplate: (judul: string) => string;
  flagField: "notif24hSent" | "notif3hSent" | "notifOverdueSent";
  getFilter: (now: Date, in3h: Date, in24h: Date) => object;
};

export async function GET(request: Request) {
  // 1. SECURITY: Cek header Authorization
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in3h = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const stats = {
    checked: 0,
    sent24h: 0,
    sent3h: 0,
    sentOverdue: 0,
  };

  // 2. KONFIGURASI KATEGORI (Data-Driven)
  const KATEGORI: KategoriNotif[] = [
    {
      key: "24h",
      title: "⏰ Deadline Besok!",
      bodyTemplate: (judul) =>
        `Tenggat "${judul}" kurang dari 24 jam lagi. Mulai kerjakan sekarang, ya.`,
      flagField: "notif24hSent",
      getFilter: (now, in3h, in24h) => ({
        status: { not: "DONE" },
        dueAt: { gte: in3h, lte: in24h },
        notif24hSent: false,
        parentId: null,
      }),
    },
    {
      key: "3h",
      title: "🚨 3 Jam Lagi, Deadline!",
      bodyTemplate: (judul) =>
        `"${judul}" mau habis waktunya. Fokus dan selesaikan sekarang!`,
      flagField: "notif3hSent",
      getFilter: (now, in3h) => ({
        status: { not: "DONE" },
        dueAt: { gt: now, lte: in3h },
        notif3hSent: false,
        parentId: null,
      }),
    },
    {
      key: "overdue",
      title: "🔥 Deadline Terlewat!",
      bodyTemplate: (judul) =>
        `Tenggat "${judul}" sudah terlewat. Selesaikan saat kamu siap untuk kembali ke rencanamu.`,
      flagField: "notifOverdueSent",
      getFilter: (now) => ({
        status: { not: "DONE" },
        dueAt: { lt: now },
        notifOverdueSent: false,
        parentId: null,
      }),
    },
  ];

  try {
    // 3. PROSES NOTIFIKASI BERDASARKAN KATEGORI
    for (const kategori of KATEGORI) {
      const tugasList = await db.task.findMany({
        where: kategori.getFilter(now, in3h, in24h),
        select: { id: true, title: true, userId: true },
      });

      stats.checked += tugasList.length;

      for (const tugas of tugasList) {
        const hasil = await kirimNotifKeUser(tugas.userId, {
          title: kategori.title,
          body: kategori.bodyTemplate(tugas.title),
          url: "/today",
          tag: `${kategori.key}-${tugas.id}`,
        });

        if (hasil.sukses > 0) {
          // Update flag di database (dynamic key)
          await db.task.update({
            where: { id: tugas.id },
            data: { [kategori.flagField]: true },
          });

          // Increment counter yang sesuai
          if (kategori.key === "24h") stats.sent24h++;
          if (kategori.key === "3h") stats.sent3h++;
          if (kategori.key === "overdue") stats.sentOverdue++;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      waktu: now.toISOString(),
      ...stats,
    });
  } catch (e: unknown) {
    console.error("[cron] Error:", e);
    const message = e instanceof Error ? e.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
