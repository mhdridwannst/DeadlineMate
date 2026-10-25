"use client";

import { useEffect, useState } from "react";
import { sfxAiSuccess, sfxClick } from "@/lib/sfx";

export default function PomodoroMini({
  judulTugas,
}: {
  judulTugas: string | null;
}) {
  const [detik, setDetik] = useState(25 * 60);
  const [jalan, setJalan] = useState(false);
  const [modeMenit, setModeMenit] = useState<25 | 10>(25);

  useEffect(() => {
    if (!jalan) return;
    const id = setInterval(() => {
      setDetik((s) => {
        if (s <= 1) {
          setJalan(false);
          sfxAiSuccess();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [jalan]);

  function pilihDurasi(m: 25 | 10) {
    sfxClick();
    setJalan(false);
    setModeMenit(m);
    setDetik(m * 60);
  }

  const totalDetik = modeMenit * 60;
  const persen = Math.round(((totalDetik - detik) / totalDetik) * 100);
  const mnt = String(Math.floor(detik / 60)).padStart(2, "0");
  const dtk = String(detik % 60).padStart(2, "0");

  return (
    <section className="kartu p-4" aria-label="Mode Fokus Pomodoro">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`size-2.5 rounded-full ${
              jalan ? "animate-ping bg-lime" : "bg-muted/40"
            }`}
          />
          <h2 className="font-extrabold">Timer Fokus</h2>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => pilihDurasi(25)}
            className={`min-h-7 min-w-0 rounded-lg border border-[color:var(--line)] px-2.5 py-0.5 text-xs font-extrabold transition ${
              modeMenit === 25 ? "bg-lime text-[#111]" : "bg-bg text-muted"
            }`}
          >
            25m
          </button>
          <button
            type="button"
            onClick={() => pilihDurasi(10)}
            title="Mulai 10 menit kalau lagi berat"
            className={`min-h-7 min-w-0 rounded-lg border border-[color:var(--line)] px-2.5 py-0.5 text-xs font-extrabold transition ${
              modeMenit === 10 ? "bg-lime text-[#111]" : "bg-bg text-muted"
            }`}
          >
            10m Cepat
          </button>
        </div>
      </div>

      <p className="mt-2 truncate text-xs font-semibold text-muted">
        Fokus: <span className="text-ink">{judulTugas ?? "Pilih tugas"}</span>
      </p>

      <div className="my-3 overflow-hidden rounded-xl border-2 border-[color:var(--line)] bg-bg">
        <div className="py-2.5 text-center font-mono text-3xl font-extrabold tracking-wider">
          {mnt}:{dtk}
        </div>
        <div className="h-1.5 w-full bg-card">
          <div
            className="h-full bg-lime transition-all duration-500"
            style={{ width: `${persen}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            sfxClick();
            setJalan((j) => !j);
          }}
          className="tombol tombol-kecil"
        >
          {jalan ? "Jeda" : "Mulai Fokus"}
        </button>
        <button
          type="button"
          onClick={() => {
            sfxClick();
            setJalan(false);
            setDetik(modeMenit * 60);
          }}
          className="tombol tombol-putih tombol-kecil"
        >
          Reset
        </button>
      </div>
    </section>
  );
}
