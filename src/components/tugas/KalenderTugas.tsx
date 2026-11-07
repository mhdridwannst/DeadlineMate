"use client";

import { useState } from "react";
import { bangunBulan } from "@/lib/kalender";
import { t as translate, type Lang } from "@/lib/i18n";

export type ItemKal = {
  id: string;
  judul: string;
  key: string;
  jam: string;
  selesai: boolean;
  sisa: string;
};

const HURUF_ID = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const HURUF_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function KalenderTugas({
  items,
  hariIni,
  lang = "id",
}: {
  items: ItemKal[];
  hariIni: string;
  lang?: Lang;
}) {
  const [y0, m0] = hariIni.split("-").map(Number);
  const [bulan, setBulan] = useState({ y: y0, m: m0 - 1 });
  const [pilih, setPilih] = useState(hariIni);

  const sel = bangunBulan(bulan.y, bulan.m);
  const ada = new Set(items.map((i) => i.key));
  const terpilih = items.filter((i) => i.key === pilih);
  const [, pm, pd] = pilih.split("-").map(Number);
  const locale = lang === "en" ? "en-US" : "id-ID";
  const hurufHari = lang === "en" ? HURUF_EN : HURUF_ID;
  const namaBulan = (tahun: number, bulan0: number) =>
    new Intl.DateTimeFormat(locale, { month: "long" }).format(
      new Date(tahun, bulan0, 1),
    );
  const namaBulanPilih = namaBulan(bulan.y, pm - 1);

  function geser(n: number) {
    const total = bulan.y * 12 + bulan.m + n;
    const bulanBerikut = {
      y: Math.floor(total / 12),
      m: ((total % 12) + 12) % 12,
    };
    setBulan(bulanBerikut);

    const awalanBulan = `${bulanBerikut.y}-${String(bulanBerikut.m + 1).padStart(2, "0")}`;
    setPilih(
      hariIni.startsWith(`${awalanBulan}-`) ? hariIni : `${awalanBulan}-01`,
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section
        className="kartu p-4 sm:p-5"
        aria-label={translate(lang, "calendarRegion")}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {namaBulan(bulan.y, bulan.m)} {bulan.y}
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => geser(-1)}
              aria-label={translate(lang, "previousMonth")}
              className="tombol tombol-putih tombol-kecil"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => geser(1)}
              aria-label={translate(lang, "nextMonth")}
              className="tombol tombol-putih tombol-kecil"
            >
              ›
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1.5 text-center sm:gap-2">
          {hurufHari.map((h) => (
            <span key={h} className="text-xs font-bold text-muted">
              {h}
            </span>
          ))}
          {sel.map((s, i) =>
            s ? (
              <button
                key={s.key}
                type="button"
                onClick={() => setPilih(s.key)}
                aria-pressed={pilih === s.key}
                aria-label={`${s.tgl} ${namaBulan(bulan.y, bulan.m)}${ada.has(s.key) ? `, ${translate(lang, "calendarHasDeadline")}` : ""}`}
                className={`relative grid aspect-square min-h-11 place-items-center rounded-xl border-2 font-semibold ${
                  s.key === hariIni
                    ? "border-ink bg-lime text-[#111]"
                    : pilih === s.key
                      ? "border-ink bg-lime-soft"
                      : "border-ink/20"
                }`}
              >
                {s.tgl}
                {ada.has(s.key) && (
                  // FIX: Warna titik diganti jadi merah bahaya biar nyatu sama tema
                  <span className="absolute bottom-1.5 size-1.5 rounded-full bg-[color:var(--bahaya)]" />
                )}
              </button>
            ) : (
              <span key={`k${i}`} />
            ),
          )}
        </div>
      </section>

      <section className="kartu p-5" aria-live="polite">
        <h2 className="text-lg font-bold">
          {translate(lang, "calendarTasksForDate", {
            date: pd,
            month: namaBulanPilih,
          })}
        </h2>
        {terpilih.length === 0 ? (
          <p className="mt-3 text-base text-muted">
            {translate(lang, "calendarEmpty")}
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {terpilih.map((t) => (
              <li key={t.id} className="rounded-xl border-2 border-ink p-3">
                <p
                  className={`font-bold ${t.selesai ? "line-through opacity-60" : ""}`}
                >
                  {t.judul}
                </p>
                <p className="text-sm text-muted">
                  {t.jam} · {t.selesai ? translate(lang, "done") : t.sisa}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
