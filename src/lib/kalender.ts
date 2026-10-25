export const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export type Sel = { tgl: number; key: string } | null;

/** Grid bulan, minggu mulai Senin. bulan0 = 0 untuk Januari. */
export function bangunBulan(tahun: number, bulan0: number): Sel[] {
  const offset = (new Date(Date.UTC(tahun, bulan0, 1)).getUTCDay() + 6) % 7;
  const jumlah = new Date(Date.UTC(tahun, bulan0 + 1, 0)).getUTCDate();
  const sel: Sel[] = Array.from({ length: offset }, () => null);
  for (let d = 1; d <= jumlah; d++) {
    sel.push({
      tgl: d,
      key: `${tahun}-${String(bulan0 + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    });
  }
  return sel;
}
