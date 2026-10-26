"use client";

import {
  useActionState,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { rencanakan, type HasilRencana } from "@/server/ai-plan";
import { sfxAiSuccess } from "@/lib/sfx";

/**
 * Pengenal tenggat ringan di sisi klien. Hanya untuk pratinjau —
 * penentuan tenggat & prioritas yang sebenarnya tetap dikerjakan AI di server.
 */
const POLA_TENGGAT =
  /\b(?:hari ini|malam ini|besok|lusa|senin|selasa|rabu|kamis|jum'?at|sabtu|minggu)(?:\s+(?:depan|ini))?(?:\s+(?:pagi|siang|sore|malam))?|\bjam\s*\d{1,2}(?:[.:]\d{2})?|\b(?:pagi|siang|sore|malam)\b/gi;

type Butir = { judul: string; tenggat: string[] };

function uraikan(teks: string): Butir[] {
  return teks
    .split(/(?:\n|,|;)+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 4)
    .map((baris) => {
      const judul = baris.replace(/^(?:\d+[.)]|[-*•])\s*/, "").trim();
      const cocok = judul.match(POLA_TENGGAT) ?? [];
      const tenggat = [...new Set(cocok.map((c) => c.toLowerCase()))];
      return { judul, tenggat };
    });
}

export function RencanaForm() {
  const [teks, setTeks] = useState("");
  const areaRef = useRef<HTMLTextAreaElement>(null);

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

  const butir = useMemo(() => uraikan(teks), [teks]);
  const jumlah = butir.length;

  // Textarea tumbuh mengikuti isi, jadi tidak perlu scroll di dalam kotak kecil.
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [teks]);

  return (
    <form action={action} className="space-y-3">
      <div className="rounded-xl border-2 border-[color:var(--line)] bg-card shadow-[0_2px_0_var(--sh)] focus-within:border-lime">
        <label htmlFor="teks-banyak" className="sr-only">
          Daftar tugas
        </label>
        <textarea
          id="teks-banyak"
          ref={areaRef}
          name="teks"
          rows={4}
          required
          value={teks}
          disabled={pending}
          onChange={(e) => setTeks(e.target.value)}
          placeholder={
            "1. Nulis Laprak, kumpul Jumat jam 16.00\n2. Tugas desain Senin depan jam 12.00\n3. UTS kalkulus besok pagi jam 08.00"
          }
          className="block w-full resize-none rounded-xl bg-transparent px-3.5 py-3 text-[13px] font-semibold leading-relaxed text-ink placeholder:font-normal placeholder:text-muted/30 focus:outline-none disabled:opacity-60"
        />
      </div>

      {/* Pratinjau: muncul saat ada tugas terdeteksi, menunjukkan apa yang ditangkap */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
          jumlah > 0 ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
        aria-live="polite"
      >
        <div className="overflow-hidden">
          <ul className="max-h-48 space-y-1.5 overflow-y-auto pb-0.5">
            {butir.map((b, i) => (
              <li
                key={`${i}-${b.judul}`}
                className="flex items-start gap-2.5 rounded-lg border border-[color:var(--line)]/25 bg-card/70 px-3 py-2"
              >
                <span
                  aria-hidden
                  className="mt-[7px] size-2 shrink-0 rounded-full bg-lime"
                />
                <div className="min-w-0 flex-1">
                  <p className="break-words text-[13px] font-bold leading-snug text-ink">
                    {b.judul}
                  </p>
                  {b.tenggat.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {b.tenggat.map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-lime-soft px-1.5 py-0.5 text-[11px] font-extrabold capitalize text-ink"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending || jumlah === 0}
        className="tombol w-full text-sm disabled:opacity-60"
      >
        {pending
          ? "Mate sedang menyusun..."
          : jumlah > 0
            ? `Susun ${jumlah} tugas`
            : "Susun tugas"}
      </button>

      {hasil && (
        <div
          role="status"
          className={`rounded-xl border-2 px-3.5 py-2.5 text-xs font-extrabold ${
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
