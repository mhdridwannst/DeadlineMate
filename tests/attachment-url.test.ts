import { describe, expect, it } from "vitest";
import { urlLampiranMilikUser } from "../src/lib/attachment-url";

const base = "https://abc123.public.blob.vercel-storage.com";

describe("urlLampiranMilikUser", () => {
  it("menerima file di folder user sendiri", () => {
    expect(urlLampiranMilikUser(`${base}/u1/laporan-x1.pdf`, "u1")).toBe(true);
  });
  it("menerima host private blob", () => {
    expect(
      urlLampiranMilikUser(
        "https://abc.private.blob.vercel-storage.com/u1/a.pdf",
        "u1",
      ),
    ).toBe(true);
  });
  it("menolak file milik user lain", () => {
    expect(urlLampiranMilikUser(`${base}/u2/laporan.pdf`, "u1")).toBe(false);
  });
  it("menolak host non-Blob dan protokol selain https", () => {
    expect(urlLampiranMilikUser("https://evil.com/u1/a.pdf", "u1")).toBe(false);
    expect(urlLampiranMilikUser("javascript:alert(1)", "u1")).toBe(false);
    expect(
      urlLampiranMilikUser(
        "http://abc.public.blob.vercel-storage.com/u1/a.pdf",
        "u1",
      ),
    ).toBe(false);
  });
  it("menolak host yang hanya menyerupai", () => {
    expect(
      urlLampiranMilikUser(
        "https://public.blob.vercel-storage.com.evil.com/u1/a.pdf",
        "u1",
      ),
    ).toBe(false);
  });
  it("menolak string kosong dan URL rusak", () => {
    expect(urlLampiranMilikUser("", "u1")).toBe(false);
    expect(urlLampiranMilikUser("bukan url", "u1")).toBe(false);
  });
});
