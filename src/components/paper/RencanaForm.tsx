"use client";

import { useActionState, useState } from "react";
import { rencanakan, type HasilRencana } from "@/server/ai-plan";
import { sfxAiSuccess, sfxClick } from "@/lib/sfx";

const CONTOH_CEPAT = [
  "Laporan praktikum sinyal kumpul Jumat, kuis Kalkulus Rabu malam",
  "Makalah Sosiologi Senin depan, rapat proker UKM Kamis jam 16.00",
];

export function RencanaForm() {
  const [teks, setTeks] = useState("");
  const [hasil, action, pending] = useActionState<HasilRencana, FormData>(
    async (prev, fd) => {
      const res = await rencanakan(prev, fd);
      if (res?.ok) {
        sfxAiSuccess();
        setTeks("");
      }
      return res;
    },
    null,
  );

  return (
    <form action={action} className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {CONTOH_CEPAT.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              sfxClick();
              setTeks(c);
            }}
            className="min-h-0 rounded-lg border border-[color:var(--line)] bg-card px-2.5 py-1 text-left text-xs font-semibold text-muted transition hover:border-lime hover:text-ink"
          >
            + Contoh {i + 1}: &ldquo;{c.slice(0, 38)}...&rdquo;
          </button>
        ))}
      </div>

      <textarea
        name="teks"
        rows={3}
        required
        value={teks}
        onChange={(e) => setTeks(e.target.value)}
        placeholder="Tulis bebas beberapa tugas sekaligus... Misal: laporan kimia kumpul Jumat, makalah sosiologi Senin depan jam 12."
        className="kolom py-2.5 leading-relaxed"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted">
          Otomatis dipecah jadi langkah maks. 90 menit
        </span>
        <button
          type="submit"
          disabled={pending || teks.trim().length < 4}
          className="tombol w-full sm:w-auto"
        >
          {pending ? "Menyusun jadwal..." : "Susun dengan Mate"}
        </button>
      </div>

      {hasil && (
        <div
          className={`rounded-xl border-2 px-3.5 py-2.5 text-xs font-bold ${
            hasil.ok
              ? "border-[color:var(--santai)] bg-[color:var(--santai-bg)] text-[color:var(--santai)]"
              : "border-[color:var(--bahaya)] bg-[color:var(--bahaya-bg)] text-[color:var(--bahaya)]"
          }`}
        >
          {hasil.pesan}
        </div>
      )}
    </form>
  );
}

export default RencanaForm;
