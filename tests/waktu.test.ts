import { describe, expect, it } from "vitest";
import { dayKey, hariKe, keDueAt, tambahHari } from "../src/lib/waktu";

describe("helper waktu WIB", () => {
  it("menggabungkan tanggal dan jam sebagai offset WIB", () => {
    expect(keDueAt("2026-11-22", "23:59").toISOString()).toBe(
      "2026-11-22T16:59:00.000Z",
    );
  });

  it("menambah hari tanpa bergantung zona waktu runtime", () => {
    expect(tambahHari("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("mengembalikan hari Minggu sebagai 0", () => {
    expect(hariKe("2026-11-22")).toBe(0);
  });

  it("menghasilkan kunci tanggal WIB", () => {
    expect(dayKey(new Date("2026-11-21T20:00:00Z"))).toBe("2026-11-22");
  });
});
