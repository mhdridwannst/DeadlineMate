import webpush from "web-push";
import { db } from "@/lib/db";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export type NotifPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export async function kirimNotifKeUser(userId: string, payload: NotifPayload) {
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
      // FIX: Type guard buat web-push error
      const err = e as { statusCode?: number };
      if (err.statusCode === 410 || err.statusCode === 404) {
        await db.pushSubscription.delete({ where: { id: sub.id } });
      }
      gagal++;
    }
  }

  return { sukses, gagal };
}
