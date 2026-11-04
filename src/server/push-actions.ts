"use server";

import { db } from "@/lib/db";
import { getDemoUser } from "@/server/demo-user";

export type SubscribeInput = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
};

export async function simpanSubscription(sub: SubscribeInput) {
  const user = await getDemoUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  try {
    // Upsert: kalau endpoint udah ada, update. Kalau belum, create.
    await db.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      update: {
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        userAgent: sub.userAgent ?? null,
      },
      create: {
        userId: user.id,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        userAgent: sub.userAgent ?? null,
      },
    });

    return { ok: true };
  } catch (e) {
    console.error("[push] Gagal simpan subscription:", e);
    return { ok: false, error: "Gagal simpan subscription." };
  }
}

export async function hapusSubscription(endpoint: string) {
  const user = await getDemoUser();
  if (!user) return { ok: false };

  await db.pushSubscription.deleteMany({
    where: { endpoint, userId: user.id },
  });

  return { ok: true };
}

export async function cekSubscription() {
  const user = await getDemoUser();
  if (!user) return { ada: false, total: 0 };

  const total = await db.pushSubscription.count({
    where: { userId: user.id },
  });

  return { ada: total > 0, total };
}
