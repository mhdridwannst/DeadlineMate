import { headers } from "next/headers";

/**
 * IP klien dari header proxy. Di Vercel, x-forwarded-for diisi platform dengan IP asli klien.
 * Hanya untuk rate limiting, bukan untuk identitas. Di host lain, sesuaikan dengan proxy-nya.
 */
export async function ambilIpKlien(): Promise<string> {
  try {
    const h = await headers();
    const xff = h.get("x-forwarded-for");
    const ip = xff?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim();
    return ip ? ip.slice(0, 64) : "unknown";
  } catch {
    return "unknown";
  }
}
