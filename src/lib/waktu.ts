export const ZONA = "Asia/Jakarta";

const fmtKunci = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const fmtTenggat = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: ZONA,
});

/** "2026-10-25" menurut WIB */
export const dayKey = (d: Date) => fmtKunci.format(d);

export const tambahHari = (key: string, n: number) =>
  new Date(Date.parse(`${key}T00:00:00Z`) + n * 86_400_000)
    .toISOString()
    .slice(0, 10);

export const hariKe = (key: string) => new Date(`${key}T00:00:00Z`).getUTCDay(); // 0 = Minggu

export const formatTenggat = (d: Date) => fmtTenggat.format(d);

export function durasi(ms: number) {
  const menit = Math.round(Math.abs(ms) / 60_000);
  if (menit < 60) return `${Math.max(1, menit)} menit`;
  const jam = Math.floor(menit / 60);
  if (jam < 48) return `${jam} jam`;
  return `${Math.floor(jam / 24)} hari`;
}

export function sisaWaktu(d: Date, now: Date) {
  const ms = d.getTime() - now.getTime();
  return ms < 0 ? `telat ${durasi(ms)}` : `${durasi(ms)} lagi`;
}

const fmtJam = new Intl.DateTimeFormat("en-GB", {
  timeZone: ZONA,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "23:59" menurut WIB */
export const jamKey = (d: Date) => fmtJam.format(d);

/** Gabungkan input tanggal (YYYY-MM-DD) dan jam (HH:mm) sebagai waktu WIB, aman di server UTC. */
export const keDueAt = (tanggal: string, jam: string) =>
  new Date(`${tanggal}T${jam}:00+07:00`);
