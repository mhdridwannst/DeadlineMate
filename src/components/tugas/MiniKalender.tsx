import { bangunBulan, NAMA_BULAN } from "@/lib/kalender";

const HURUF = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export default function MiniKalender({
  tahun,
  bulan0,
  hariIni,
  titik,
}: {
  tahun: number;
  bulan0: number;
  hariIni: string;
  titik: string[];
}) {
  const sel = bangunBulan(tahun, bulan0);
  const adaTugas = new Set(titik);
  return (
    <section
      className="kartu p-4"
      aria-label={`Kalender ${NAMA_BULAN[bulan0]} ${tahun}`}
    >
      <h2 className="text-base font-extrabold text-ink">
        {NAMA_BULAN[bulan0]} {tahun}
      </h2>
      <div className="mt-3 grid grid-cols-7 gap-y-1 text-center text-sm">
        {HURUF.map((h) => (
          <span key={h} className="pb-1.5 text-xs font-extrabold text-muted">
            {h}
          </span>
        ))}
        {sel.map((s, i) =>
          s ? (
            <span
              key={s.key}
              className={`relative mx-auto grid size-9 place-items-center rounded-lg text-xs font-bold ${
                s.key === hariIni
                  ? "border-2 border-[color:var(--line)] bg-lime font-extrabold text-[#111310]"
                  : "text-ink"
              }`}
            >
              {s.tgl}
              {adaTugas.has(s.key) && (
                <span
                  aria-label="ada deadline"
                  className="absolute bottom-0.5 size-1.5 rounded-full bg-[color:var(--warn-line)]"
                />
              )}
            </span>
          ) : (
            <span key={`k${i}`} />
          ),
        )}
      </div>
    </section>
  );
}
