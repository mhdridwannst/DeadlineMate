import webpush from "web-push";
import { db } from "@/lib/db";

export type NotifPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export async function kirimNotifKeUser(userId: string, payload: NotifPayload) {
  const subject = process.env.VAPID_SUBJECT?.trim();
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();

  if (!subject || !publicKey || !privateKey) {
    console.warn(
      "[push] VAPID keys tidak lengkap — skip pengiriman. " +
        `subject=${!!subject}, publicKey=${!!publicKey}, privateKey=${!!privateKey}`,
    );
    return { sukses: 0, gagal: 0 };
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  const subs = await db.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return { sukses: 0, gagal: 0 };

  const stringified = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/today",
    tag: payload.tag ?? "reminder",
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
        stringified,
      );
      sukses++;
    } catch (e: unknown) {
      const err = e as { statusCode?: number; message?: string };

      // Cleanup: subscription sudah tidak valid di sisi browser
      if (err.statusCode === 410 || err.statusCode === 404) {
        await db.pushSubscription.delete({ where: { id: sub.id } });
      } else {
        // Log error yang bukan cleanup-case biar bisa di-debug
        console.warn(
          `[push] Gagal kirim ke sub ${sub.id} ` +
            `(status=${err.statusCode ?? "?"}): ${err.message ?? "unknown"}`,
        );
      }
      gagal++;
    }
  }

  return { sukses, gagal };
}
