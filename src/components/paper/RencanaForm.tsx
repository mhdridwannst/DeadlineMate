"use client";

import {
  useActionState,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { rencanakan, type HasilRencana } from "@/server/ai-plan";
import { sfxAiSuccess, sfxClick } from "@/lib/sfx";

const POLA_TENGGAT =
  /\b(?:hari ini|malam ini|besok|lusa|senin|selasa|rabu|kamis|jum'?at|sabtu|minggu)(?:\s+(?:depan|ini))?(?:\s+(?:pagi|siang|sore|malam))?|\bjam\s*\d{1,2}(?:[.:]\d{2})?|\b(?:pagi|siang|sore|malam)\b/gi;

type Butir = { judul: string; tenggat: string[] };

function uraikan(teks: string): Butir[] {
  return teks
    .split(/(?:\n|,|;)+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 4)
    .map((baris) => {
      const judul = baris
        .replace(/^(?:\d+[.)]|[-*•])\s*/, "")
        .replace(/^(?:\d+\s+)/, "")
        .trim();
      const cocok = judul.match(POLA_TENGGAT) ?? [];
      const tenggat = [...new Set(cocok.map((c) => c.toLowerCase()))];
      return { judul, tenggat };
    });
}

export function RencanaForm() {
  const [teks, setTeks] = useState("");
  const [rekam, setRekam] = useState(false);
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

  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [teks]);

  function mulaiSuara() {
    sfxClick();
    const Win = window as unknown as {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const SR = Win.SpeechRecognition || Win.webkitSpeechRecognition;
    if (!SR) {
      alert("Browser ini belum mendukung mikrofon. Ketik manual ya!");
      return;
    }

    const rec = new SR();
    rec.lang = "id-ID";
    rec.interimResults = false;
    rec.onstart = () => setRekam(true);
    rec.onend = () => setRekam(false);
    rec.onerror = () => setRekam(false);
    rec.onresult = (e: any) => {
      const hasilSuara = e.results?.[0]?.[0]?.transcript ?? "";
      if (hasilSuara) {
        setTeks((lama) => (lama ? `${lama}, ${hasilSuara}` : hasilSuara));
      }
    };
    rec.start();
  }

  return (
    <form action={action} className="space-y-4">
      <div className="relative group">
        <div className="absolute inset-0 bg-[color:var(--line)] rounded-xl translate-y-1 translate-x-1 transition-transform group-focus-within:translate-y-1.5 group-focus-within:translate-x-1.5" />
        <div className="relative bg-card border-2 border-[color:var(--line)] rounded-xl overflow-hidden transition-transform group-focus-within:-translate-y-0.5 group-focus-within:-translate-x-0.5">
          <div className="flex items-center justify-between px-3 py-2 border-b-2 border-[color:var(--line)] bg-[color:var(--surface-2)]">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">
              Ketik / Tempel Tugas
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted bg-card px-2 py-0.5 rounded border border-[color:var(--line)]">
                {jumlah} terdeteksi
              </span>
              <button
                type="button"
                onClick={mulaiSuara}
                className={`grid size-6 place-items-center rounded-md border-2 transition-all ${rekam ? "border-[color:var(--bahaya)] bg-[color:var(--bahaya-bg)] text-[color:var(--bahaya)] animate-pulse" : "border-[color:var(--line)] bg-card text-ink hover:bg-lime"}`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" />
                </svg>
              </button>
            </div>
          </div>
          <textarea
            ref={areaRef}
            name="teks"
            rows={4}
            required
            value={teks}
            disabled={pending}
            onChange={(e) => setTeks(e.target.value)}
            spellCheck="false"
            placeholder={
              "Ketik manual atau tinggal ngomong, bisa kok:\n\nContoh: Nulis laprak besok jam 4, tugas desain senin depan jam 12"
            }
            className="block w-full resize-none bg-transparent px-4 py-3 text-[13px] font-bold leading-relaxed text-ink placeholder:text-muted/70 focus:outline-none disabled:opacity-60 hide-scrollbar"
          />
        </div>
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${jumlah > 0 ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        aria-live="polite"
      >
        <div className="overflow-hidden">
          <div className="bg-card border-2 border-[color:var(--line)] rounded-xl p-3 shadow-[0_3px_0_var(--sh)] relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted">
                Pratinjau AI
              </span>
              <span className="text-[10px] font-bold text-biru bg-[color:var(--biru-soft)] px-1.5 py-0.5 rounded border border-biru/20">
                Live Parse
              </span>
            </div>
            <ul className="max-h-48 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
              {butir.map((b, i) => (
                <li
                  key={`${i}-${b.judul}`}
                  className="flex items-start gap-2.5 rounded-lg border-2 border-[color:var(--line)]/20 bg-[color:var(--surface)] px-3 py-2 transition-colors hover:border-[color:var(--line)]/50"
                >
                  <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded bg-lime border border-[#111] text-[9px] font-black text-[#111]">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-[13px] font-bold leading-snug text-ink">
                      {b.judul}
                    </p>
                    {b.tenggat.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {b.tenggat.map((t) => (
                          <span
                            key={t}
                            className="rounded-md border border-[color:var(--line)]/30 bg-[color:var(--surface-2)] px-1.5 py-0.5 text-[10px] font-extrabold capitalize text-ink"
                          >
                            ⏱ {t}
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
      </div>

      <button
        type="submit"
        disabled={pending || jumlah === 0}
        onClick={() => sfxClick()}
        className="relative w-full group disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        <div className="absolute inset-0 bg-[#111] rounded-xl translate-y-1.5 transition-transform group-hover:translate-y-2 group-active:translate-y-0" />
        <div
          className={`relative flex items-center justify-center gap-2 w-full border-2 border-[#111] rounded-xl py-3.5 text-sm font-black transition-transform group-hover:-translate-y-0.5 group-active:translate-y-1 ${jumlah > 0 ? "bg-lime text-[#111]" : "bg-[color:var(--surface-2)] text-muted border-[color:var(--line)]"}`}
        >
          {pending ? (
            <>
              <svg
                className="animate-spin size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Mate menyusun...
            </>
          ) : jumlah > 0 ? (
            <>✦ Susun {jumlah} Tugas Sekarang</>
          ) : (
            "Ketik tugas dulu..."
          )}
        </div>
      </button>

      {hasil && (
        <div
          role="status"
          className={`rounded-xl border-2 px-3.5 py-3 text-xs font-extrabold flex items-start gap-2 ${hasil.ok ? "border-[color:var(--santai)] bg-[color:var(--santai-bg)] text-[color:var(--santai)]" : "border-[color:var(--bahaya)] bg-[color:var(--bahaya-bg)] text-[color:var(--bahaya)]"}`}
        >
          <span className="text-base leading-none">
            {hasil.ok ? "✅" : "⚠️"}
          </span>
          <p className="leading-snug">{hasil.pesan}</p>
        </div>
      )}
    </form>
  );
}

export default RencanaForm;
