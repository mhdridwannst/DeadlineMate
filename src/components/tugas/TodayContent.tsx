"use client";

import { useState } from "react";
import { DICT, type Lang } from "@/lib/i18n";
import DaftarTugas, { type Item } from "./DaftarTugas";
import StatKartu from "./StatKartu";
import MiniKalender from "./MiniKalender";
import { MateChat } from "./MateChat";
import { hariKe } from "@/lib/waktu";
import { Icon } from "../ui/Icon";

export default function TodayContent({
  aktif,
  sudah,
  r,
  lang,
  tanggalPanjang,
  tahun,
  bulan,
  titik,
  tujuhHari,
  hariAda,
  hurufHari,
  isiCatatanMate,
  mendesak,
  terdekat,
  now,
}: {
  aktif: Item[];
  sudah: Item[];
  r: any;
  lang: Lang;
  tanggalPanjang: string;
  tahun: number;
  bulan: number;
  titik: string[];
  tujuhHari: string[];
  hariAda: string[];
  hurufHari: string[];
  isiCatatanMate: string;
  mendesak: Item | null;
  terdekat: Item | null;
  now: number;
}) {
  const t = DICT[lang];
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [viewDate, setViewDate] = useState({ tahun, bulan0: bulan - 1 });

  const handlePrevMonth = () => {
    setViewDate((prev) => {
      const d = new Date(prev.tahun, prev.bulan0 - 1, 1);
      return { tahun: d.getFullYear(), bulan0: d.getMonth() };
    });
  };

  const handleNextMonth = () => {
    setViewDate((prev) => {
      const d = new Date(prev.tahun, prev.bulan0 + 1, 1);
      return { tahun: d.getFullYear(), bulan0: d.getMonth() };
    });
  };

  // LOGIKA FILTERING
  const filteredAktif = aktif.filter((i) => {
    const matchDate = selectedDate ? i.tanggal === selectedDate : true;
    const matchSearch = search
      ? i.judul.toLowerCase().includes(search.toLowerCase()) ||
        (i.kategori && i.kategori.toLowerCase().includes(search.toLowerCase()))
      : true;
    return matchDate && matchSearch;
  });

  const filteredSudah = sudah.filter((i) => {
    const matchDate = selectedDate ? i.tanggal === selectedDate : true;
    const matchSearch = search
      ? i.judul.toLowerCase().includes(search.toLowerCase()) ||
        (i.kategori && i.kategori.toLowerCase().includes(search.toLowerCase()))
      : true;
    return matchDate && matchSearch;
  });

  return (
    <div className="space-y-5 lg:space-y-6 pb-24 lg:pb-10">
      {/* ================= HEADER & SEARCH BAR ================= */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 border-b-2 border-[color:var(--line)]/20 pb-4">
        <div className="flex items-center justify-between gap-3 w-full">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted mb-0.5">
              {tanggalPanjang}
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-ink">
              <span className="judul-stabilo">{t.taskList}</span>
            </h1>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[color:var(--line)] bg-[color:var(--lime)] px-3 py-1 shadow-[0_2px_0_var(--sh)] shrink-0">
            <span className="text-sm font-black text-[#111]">
              {filteredAktif.length}
            </span>
            <span className="text-[10px] font-extrabold uppercase text-[#111]">
              Tugas
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          {selectedDate && (
            <span className="inline-flex items-center gap-1 rounded-lg border-2 border-[color:var(--line)] bg-[#FFE8A1] px-2 py-1.5 text-xs font-black text-[#111] shadow-[0_2px_0_var(--sh)] shrink-0 animate-in fade-in zoom-in">
              <Icon name="calendar" className="size-3.5" />

              {selectedDate.split("-").reverse().join("/")}
              <button
                onClick={() => setSelectedDate(null)}
                className="ml-0.5 hover:text-red-600 transition-colors"
              >
                ✕
              </button>
            </span>
          )}

          <div className="relative w-full lg:w-64 group">
            <input
              type="text"
              placeholder="Cari tugas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[color:var(--surface)] border-2 border-[color:var(--line)] rounded-lg pl-9 pr-8 py-2 text-sm font-bold placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[color:var(--lime)] focus:border-[color:var(--lime)] shadow-[0_2px_0_var(--sh)] transition-all group-hover:-translate-y-0.5 group-focus-within:shadow-[0_4px_0_var(--sh)]"
            />
            <svg
              viewBox="0 0 24 24"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-[color:var(--muted)] group-focus-within:text-[color:var(--ink)] transition-all group-focus-within:scale-110"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 grid size-5 place-items-center rounded bg-[color:var(--line)] text-[color:var(--bg)] hover:bg-[color:var(--bahaya)] transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= BANNER DEADLINE ================= */}
      {mendesak && mendesak.tanggal && (
        <section
          className="kartu flex items-center gap-3 p-3 animate-in slide-in-from-top-2"
          style={{
            background: "var(--warn)",
            borderColor: "var(--warn-line)",
            color: "var(--warn-ink)",
            boxShadow: "0 3px 0 var(--warn-line)",
          }}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border-2 border-[color:var(--warn-line)] bg-[color:var(--card)] text-sm font-black text-[color:var(--warn-ink)] animate-pulse">
            <Icon name="alert" className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-extrabold leading-tight">
              Deadline Mendekat
            </p>
            <p className="text-[11px] font-semibold opacity-90 leading-tight mt-0.5 truncate">
              “{mendesak.judul}” dalam <strong>{mendesak.sisa}</strong>
            </p>
          </div>
        </section>
      )}

      {/* ================= MAIN GRID ================= */}
      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_21rem] gap-6">
        {/* KOLOM KIRI */}
        <div className="space-y-4 order-1 lg:order-1">
          {/* MOBILE HUD */}
          <div className="lg:hidden flex w-full overflow-hidden rounded-xl border-2 border-[color:var(--line)] bg-card shadow-[0_3px_0_var(--sh)]">
            <div className="flex flex-1 flex-col items-center justify-center border-r-2 border-[color:var(--line)] py-2.5 px-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted">
                Streak
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm">
                  <Icon name="flame" className="size-4 text-oranye" />
                </span>
                <span className="text-xl font-black font-mono text-ink">
                  {r.streak}
                </span>
              </div>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center border-r-2 border-[color:var(--line)] py-2.5 px-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted">
                EXP
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-black bg-[color:var(--lime)] border-2 border-[#111] px-1.5 py-0.5 rounded-md text-[#111]">
                  L{r.level}
                </span>
                <span className="text-xl font-black font-mono text-ink">
                  {r.expLevel}
                </span>
              </div>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center py-2.5 px-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted">
                Hari Ini
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-black font-mono text-ink">
                  {r.hariIniSelesai}
                </span>
                <span className="text-sm font-bold text-muted">
                  /{r.hariIniTotal}
                </span>
              </div>
            </div>
          </div>

          {/* DESKTOP STATS */}
          <div className="hidden lg:block">
            <StatKartu
              streak={r.streak}
              rekor={r.rekor}
              level={r.level}
              exp={r.expLevel}
              selesai={r.hariIniSelesai}
              total={r.hariIniTotal}
              lang={lang}
            />
          </div>

          {/* DAFTAR TUGAS */}
          {filteredAktif.length > 0 ? (
            <DaftarTugas items={filteredAktif} />
          ) : (
            <section className="kartu p-8 sm:p-12 text-center mt-2 bg-[color:var(--surface-2)] border-2 border-[color:var(--line)] shadow-[0_4px_0_var(--sh)] relative overflow-hidden group">
              <div
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(#111 2px, transparent 2px)",
                  backgroundSize: "16px 16px",
                }}
              ></div>
              <div className="relative z-10">
                <div className="mx-auto grid size-20 place-items-center rounded-2xl border-2 border-[#141513] bg-lime text-[#111310] shadow-[0_4px_0_var(--sh)] transition-transform group-hover:-translate-y-2 group-hover:rotate-3">
                  <span className="text-4xl animate-bounce">
                    <Icon
                      name="check"
                      className="size-10 text-[#111]"
                      strokeWidth={3}
                    />
                  </span>
                </div>
                <h2 className="mt-5 text-2xl font-black text-ink">
                  {search || selectedDate
                    ? "Tidak Ada Tugas yang Cocok"
                    : "Tugas kamu udah selesai atau belum ada nih?"}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm font-bold text-muted leading-relaxed">
                  {search || selectedDate
                    ? "Coba ubah kata kunci atau pilih tanggal lain di kalender."
                    : "Kamu bisa nambah jadwal tugasmu di (+) Tugas Baru"}
                </p>
              </div>
            </section>
          )}

          {filteredSudah.length > 0 && (
            <details className="kartu group mt-4">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 font-extrabold text-ink">
                <span className="flex items-center gap-2 text-sm">
                  <span className="inline-block size-2.5 rounded-full bg-lime" />
                  <span>
                    {t.completedTasks} ({filteredSudah.length})
                  </span>
                </span>
                <span className="text-xs font-bold text-muted transition-transform group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <div className="border-t-2 border-[color:var(--line)]/15 p-3 sm:p-4">
                <DaftarTugas items={filteredSudah} />
              </div>
            </details>
          )}

          {/* MOBILE KALENDER */}
          <div className="lg:hidden space-y-4 mt-6">
            <MiniKalender
              tahun={viewDate.tahun}
              bulan0={viewDate.bulan0}
              hariIni={r.today}
              titik={titik}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
            />
          </div>
        </div>

        {/* KOLOM KANAN (DESKTOP) */}
        <aside className="hidden lg:block space-y-4 order-2 lg:order-2 lg:sticky lg:top-24 lg:self-start">
          <MateChat text={isiCatatanMate} title={t.mateNote} />

          {terdekat && (
            <section className="kartu p-4" aria-label={t.nearestDeadline}>
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-[#141513] bg-lime text-[#111310]">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">
                    {t.nearestDeadline}
                  </p>
                  <p className="truncate text-base font-extrabold text-ink">
                    {terdekat.judul}
                  </p>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-[color:var(--line)]/20 bg-bg p-3">
                <p className="text-xl font-extrabold text-[color:var(--warn-line)]">
                  {terdekat.sisa}
                </p>
                <p className="text-xs font-semibold text-muted">
                  {terdekat.tenggat}
                </p>
              </div>
            </section>
          )}

          <MiniKalender
            tahun={viewDate.tahun}
            bulan0={viewDate.bulan0}
            hariIni={r.today}
            titik={titik}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />

          <section className="kartu p-4" aria-label={t.consistency7d}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-ink text-sm uppercase tracking-wider">
                {t.consistency7d}
              </h2>
              <span className="text-[10px] font-bold text-muted bg-[color:var(--surface-2)] px-2 py-0.5 rounded border border-[color:var(--line)]/20">
                7d
              </span>
            </div>

            <ul className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
              {tujuhHari.map((k) => {
                const aktifHari = hariAda.includes(k);
                const isToday = k === r.today;

                return (
                  <li key={k} className="flex flex-col items-center gap-1.5">
                    <div
                      className={`flex aspect-square w-full items-center justify-center rounded-lg border-2 transition-all ${
                        aktifHari
                          ? "border-[#111] bg-lime text-[#111] shadow-[0_2px_0_var(--sh)]"
                          : isToday
                            ? "border-[#111] bg-card text-[#111]"
                            : "border-[color:var(--line)]/20 bg-transparent text-muted/20"
                      }`}
                    >
                      {aktifHari ? (
                        <svg
                          viewBox="0 0 24 24"
                          className="size-3.5 sm:size-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12l5 5 9-10" />
                        </svg>
                      ) : isToday ? (
                        <span className="text-[9px] font-black uppercase">
                          INI
                        </span>
                      ) : null}
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase tracking-wider ${
                        isToday ? "text-ink" : "text-muted/60"
                      }`}
                    >
                      {hurufHari[hariKe(k)]}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
