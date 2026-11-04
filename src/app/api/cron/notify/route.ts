import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { kirimNotifKeUser } from "@/server/push-utils";

export async function GET(request: Request) {
  // 1. SECURITY: Cek header Authorization
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const stats = { checked: 0, sent24h: 0, sent3h: 0, sentOverdue: 0 };

  try {
    // ==================== KATEGORI 1: H-24 JAM ====================
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in3h = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    const tugas24h = await db.task.findMany({
      where: {
        status: { not: "DONE" },
        dueAt: { gte: in3h, lte: in24h },
        notif24hSent: false,
        parentId: null,
      },
      select: { id: true, title: true, userId: true },
    });

    for (const t of tugas24h) {
      const result = await kirimNotifKeUser(t.userId, {
        title: "⏰ Deadline Besok!",
        body: `Jangan lupa, "${t.title}" due dalam kurang dari 24 jam. Yuk cicil sekarang!`,
        url: "/today",
        tag: `24h-${t.id}`,
      });
      if (result.sukses > 0) {
        await db.task.update({
          where: { id: t.id },
          data: { notif24hSent: true },
        });
        stats.sent24h++;
      }
    }

    // ==================== KATEGORI 2: 3 JAM ====================
    const tugas3h = await db.task.findMany({
      where: {
        status: { not: "DONE" },
        dueAt: { gt: now, lte: in3h },
        notif3hSent: false,
        parentId: null,
      },
      select: { id: true, title: true, userId: true },
    });

    for (const t of tugas3h) {
      const result = await kirimNotifKeUser(t.userId, {
        title: "🚨 3 Jam Lagi, Deadline!",
        body: `"${t.title}" mau habis waktunya. Fokus dan selesaikan sekarang!`,
        url: "/today",
        tag: `3h-${t.id}`,
      });
      if (result.sukses > 0) {
        await db.task.update({
          where: { id: t.id },
          data: { notif3hSent: true },
        });
        stats.sent3h++;
      }
    }

    // ==================== KATEGORI 3: TELAT ====================
    const tugasTelat = await db.task.findMany({
      where: {
        status: { not: "DONE" },
        dueAt: { lt: now },
        notifOverdueSent: false,
        parentId: null,
      },
      select: { id: true, title: true, userId: true },
    });

    for (const t of tugasTelat) {
      const result = await kirimNotifKeUser(t.userId, {
        title: "🔥 Deadline Terlewat!",
        body: `"${t.title}" udah lewat deadline. Streak lo terancam!`,
        url: "/today",
        tag: `overdue-${t.id}`,
      });
      if (result.sukses > 0) {
        await db.task.update({
          where: { id: t.id },
          data: { notifOverdueSent: true },
        });
        stats.sentOverdue++;
      }
    }

    return NextResponse.json({
      ok: true,
      waktu: now.toISOString(),
      ...stats,
    });
  } catch (e: unknown) {
    console.error("[cron] Error:", e);
    // FIX: Cek dulu apakah e beneran Error object
    const message = e instanceof Error ? e.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
