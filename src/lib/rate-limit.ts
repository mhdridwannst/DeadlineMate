import { db } from "@/lib/db";

export async function cekRateLimit(
  scope: string,
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const now = new Date();
  let bucket = await db.rateLimitBucket.findUnique({
    where: { key_scope: { key, scope } },
  });

  if (!bucket || bucket.windowStart.getTime() + windowMs <= now.getTime()) {
    bucket = await db.rateLimitBucket.upsert({
      where: { key_scope: { key, scope } },
      create: { key, scope, windowStart: now, count: 1 },
      update: { windowStart: now, count: 1 },
    });
  } else {
    bucket = await db.rateLimitBucket.update({
      where: { key_scope: { key, scope } },
      data: { count: { increment: 1 } },
    });
  }

  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
  };
}
