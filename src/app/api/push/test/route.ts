import { NextResponse } from "next/server";
import webpush from "web-push";
import { auth } from "@/auth";
import { db } from "@/lib/db";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subs = await db.pushSubscription.findMany({
    where: { userId: session.user.id },
  });

  if (subs.length === 0) {
    return NextResponse.json(
      { error: "Belum ada subscription. Aktifkan notifikasi dulu." },
      { status: 400 },
    );
  }

  const payload = JSON.stringify({
    title: "🔔 Test Notifikasi Berhasil!",
    body: "Kalau lo liat ini, berarti push notification DeadlineMate udah jalan. Mantap!",
    url: "/today",
    tag: "test-notif",
  });

  let sukses = 0;
  let gagal = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
      );
      sukses++;
    } catch (e) {
      console.warn("[push] Gagal kirim ke satu subscription:", e);
      // Kalau subscription expired (410/404), hapus dari DB
      if (
        e &&
        typeof e === "object" &&
        "statusCode" in e &&
        (e.statusCode === 410 || e.statusCode === 404)
      ) {
        await db.pushSubscription.delete({ where: { id: sub.id } });
      }
      gagal++;
    }
  }

  return NextResponse.json({ ok: true, sukses, gagal });
}
