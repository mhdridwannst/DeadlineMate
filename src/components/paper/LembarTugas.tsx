"use client";

import { useOptimistic, useState, useTransition } from "react";
import { ubahStatus, hapusTugas } from "@/server/tasks";

export type Langkah = {
  id: string;
  judul: string;
  selesai: boolean;
  info: string;
  menit: number | null;
};
export type TugasView = {
  id: string;
  judul: string;
  selesai: boolean;
  info: string;
  telat: boolean;
  langkah: Langkah[];
};

function Bulatan({
  terisi,
  onClick,
  label,
}: {
  terisi: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={terisi}
      aria-label={label}
      className="grid size-11 shrink-0 place-items-center rounded-full"
    >
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
        <circle
          cx="16"
          cy="16"
          r="13"
          fill="none"
          stroke="var(--pensil)"
          strokeWidth="2"
        />
        <path
          d="M7 21 L21 7 M7 27 L27 7 M11 27 L27 11 M7 15 L15 7 M17 27 L27 17"
          stroke="var(--pensil)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={terisi ? 0 : 1}
          style={{ transition: "stroke-dashoffset 260ms ease-out" }}
          clipPath="circle(12px at 16px 16px)"
        />
      </svg>
    </button>
  );
}

export default function LembarTugas({ tugas }: { tugas: TugasView[] }) {
  const [, mulai] = useTransition();
  const [terbuka, setTerbuka] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useOptimistic<
    Record<string, boolean>,
    { id: string; nilai: boolean }
  >({}, (s, a) => ({ ...s, [a.id]: a.nilai }));

  const selesai = (id: string, asli: boolean) =>
    id in status ? status[id] : asli;

  function ganti(id: string, asli: boolean) {
    const nilai = !selesai(id, asli);
    mulai(async () => {
      setStatus({ id, nilai });
      await ubahStatus(id, nilai);
    });
  }

  return (
    <ul className="lembar">
      {tugas.map((t) => {
        const sudah = selesai(t.id, t.selesai);
        const sisa = t.langkah.filter((l) => !selesai(l.id, l.selesai));
        const berikut = sisa[0];
        const buka = terbuka[t.id];
        const tampil = buka ? t.langkah : berikut ? [berikut] : [];

        return (
          <li key={t.id} className="pb-2 pt-1">
            <div className="flex items-start gap-1 pr-2">
              <div className="flex w-[var(--gutter)] shrink-0 justify-center pt-1">
                <Bulatan
                  terisi={sudah}
                  onClick={() => ganti(t.id, t.selesai)}
                  label={`Tandai selesai: ${t.judul}`}
                />
              </div>
              <div className="min-w-0 flex-1 pl-3 pt-2">
                <p
                  className={`text-lg font-semibold leading-snug ${sudah ? "text-pensil/45 line-through" : ""}`}
                >
                  {t.judul}
                </p>
                <p className="mt-0.5 text-sm text-pensil/70">
                  <span
                    className={
                      t.telat && !sudah ? "font-semibold text-merah" : ""
                    }
                  >
                    {t.info}
                  </span>
                  {t.langkah.length > 0 && (
                    <>
                      {" "}
                      · {t.langkah.length - sisa.length} dari {t.langkah.length}{" "}
                      langkah
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Hapus "${t.judul}"?`))
                    mulai(async () => void (await hapusTugas(t.id)));
                }}
                aria-label={`Hapus ${t.judul}`}
                className="grid size-11 place-items-center rounded-full text-pensil/50 hover:text-merah"
              >
                ✕
              </button>
            </div>

            {tampil.length > 0 && (
              <ol className="ml-[var(--gutter)] pl-3 pr-2">
                {tampil.map((l) => {
                  const lsel = selesai(l.id, l.selesai);
                  return (
                    <li key={l.id} className="flex items-center gap-1">
                      <Bulatan
                        terisi={lsel}
                        onClick={() => ganti(l.id, l.selesai)}
                        label={`Tandai selesai: ${l.judul}`}
                      />
                      <div className="min-w-0 flex-1 py-1">
                        <p
                          className={`text-base leading-snug ${lsel ? "text-pensil/45 line-through" : ""}`}
                        >
                          {l.judul}
                        </p>
                        <p className="text-sm text-pensil/60">
                          {l.info}
                          {l.menit ? ` · ${l.menit} menit` : ""}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {t.langkah.length > 1 && (
              <button
                type="button"
                aria-expanded={!!buka}
                onClick={() => setTerbuka((s) => ({ ...s, [t.id]: !s[t.id] }))}
                className="ml-[var(--gutter)] pl-3 text-sm font-semibold text-tinta underline-offset-4 hover:underline"
              >
                {buka
                  ? "Ringkas langkah"
                  : `Lihat semua ${t.langkah.length} langkah`}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
