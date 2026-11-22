import { db } from "@/lib/db";

type HasilRateLimit = { allowed: boolean; remaining: number };

const punyaKode = (e: unknown, kode: string) =>
  typeof e === "object" &&
  e !== null &&
  (e as { code?: unknown }).code === kode;

// Baris yang jendelanya sudah lewat lebih dari ini dibersihkan.
// Harus lebih besar dari jendela terpanjang yang dipakai aplikasi (saat ini 24 jam).
const UMUR_BARIS_MAKS_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * Fixed-window rate limiter berbasis database.
 * Kenaikan counter dilakukan atomik di database, jadi request paralel tidak saling menimpa.
 */
export async function cekRateLimit(
  scope: string,
  key: string,
  limit: number,
  windowMs: number,
): Promise<HasilRateLimit> {
  const sekarang = new Date();
  const batas = new Date(sekarang.getTime() - windowMs);
  const hasil = (count: number): HasilRateLimit => ({
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
  });

  // Pembersihan kecil-kecilan: sesekali hapus baris lama supaya tabel tidak membengkak.
  if (Math.random() < 0.02) {
    await db.rateLimitBucket
      .deleteMany({
        where: {
          windowStart: {
            lt: new Date(sekarang.getTime() - UMUR_BARIS_MAKS_MS),
          },
        },
      })
      .catch(() => {});
  }

  for (let percobaan = 0; percobaan < 3; percobaan++) {
    // 1) Jendela masih aktif: naikkan counter secara atomik dan baca nilainya.
    try {
      const bucket = await db.rateLimitBucket.update({
        where: {
          key_scope: { key, scope },
          windowStart: { gt: batas },
        },
        data: { count: { increment: 1 } },
        select: { count: true },
      });
      return hasil(bucket.count);
    } catch (e) {
      if (!punyaKode(e, "P2025")) throw e; // P2025 = baris tidak ada / jendela sudah lewat
    }

    // 2) Jendela sudah lewat: mulai jendela baru.
    const direset = await db.rateLimitBucket.updateMany({
      where: { key, scope, windowStart: { lte: batas } },
      data: { windowStart: sekarang, count: 1 },
    });
    if (direset.count === 1) return hasil(1);

    // 3) Belum ada baris: buat baru.
    try {
      await db.rateLimitBucket.create({
        data: { key, scope, windowStart: sekarang, count: 1 },
      });
      return hasil(1);
    } catch (e) {
      if (!punyaKode(e, "P2002")) throw e;
      // Request lain baru saja membuat baris yang sama: ulangi dari langkah 1.
    }
  }

  // Terlalu banyak balapan berturut-turut (nyaris mustahil). Tolak demi aman.
  return { allowed: false, remaining: 0 };
}
