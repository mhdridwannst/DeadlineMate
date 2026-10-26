"use client";

import { useState, useTransition } from "react";
import { isiOtomatisTugasAI, simpanTugas } from "@/server/tugas-form";
import { rencanakan } from "@/server/ai-plan";
import { sfxAiSuccess, sfxClick } from "@/lib/sfx";
import type { Lang } from "@/lib/i18n";

export default function InlineOmnibar({ lang = "id" }: { lang?: Lang }) {
  const [teks, setTeks] = useState("");
  const [mode, setMode] = useState<"cepat" | "ai">("cepat");
  const [pesan, setPesan] = useState<{ ok: boolean; info: string } | null>(
    null,
  );
  const [pending, mulai] = useTransition();

  function prosesSubmit(e: React.FormEvent) {
    e.preventDefault();
    const kalimat = teks.trim();
    if (kalimat.length < 3 || pending) return;

    sfxClick();
    setPesan(null);

    mulai(async () => {
      if (mode === "cepat") {
        const hasilEkstrak = await isiOtomatisTugasAI(kalimat);
        if (!hasilEkstrak.ok) {
          setPesan({ ok: false, info: hasilEkstrak.error });
          return;
        }
        const fd = new FormData();
        fd.set("judul", hasilEkstrak.data.judul);
        fd.set("tanggal", hasilEkstrak.data.tanggal);
        fd.set("jam", hasilEkstrak.data.jam);
        fd.set("kategori", hasilEkstrak.data.kategori);
        fd.set("estimasi", String(hasilEkstrak.data.estimasiJam));
        fd.set("prioritas", hasilEkstrak.data.prioritas);

        const simpan = await simpanTugas({ ok: false }, fd);
        if (simpan.ok) {
          sfxAiSuccess();
          setTeks("");
          setPesan({
            ok: true,
            info:
              lang === "en"
                ? `Added "${hasilEkstrak.data.judul}" (${hasilEkstrak.data.tanggal} · ${hasilEkstrak.data.jam})`
                : `Tugas "${hasilEkstrak.data.judul}" berhasil ditambahkan!`,
          });
        } else {
          setPesan({
            ok: false,
            info: simpan.error ?? "Gagal menyimpan tugas.",
          });
        }
      } else {
        const fd = new FormData();
        fd.set("teks", kalimat);
        const res = await rencanakan(null, fd);
        if (res?.ok) {
          sfxAiSuccess();
          setTeks("");
          setPesan({ ok: true, info: res.pesan });
        } else {
          setPesan({
            ok: false,
            info: res?.pesan ?? "Gagal menyusun rencana.",
          });
        }
      }
    });
  }

  return (
    <div className="kartu p-3.5">
      <form onSubmit={prosesSubmit} className="space-y-2.5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border-2 border-[#141513] bg-lime text-xs font-extrabold text-[#111310]">
            ✦
          </span>
          <input
            type="text"
            value={teks}
            onChange={(e) => setTeks(e.target.value)}
            disabled={pending}
            placeholder={
              mode === "cepat"
                ? lang === "en"
                  ? "Quick add: 'Calculus quiz tomorrow 19:00' then Enter..."
                  : "Ketik tugas cepat, mis: 'Laporan sinyal besok jam 16.00'..."
                : lang === "en"
                  ? "Write multiple tasks at once, Mate will split them..."
                  : "Ketik beberapa tugas sekaligus, Mate otomatis pecah langkah..."
            }
            className="w-full min-w-0 bg-transparent text-sm font-bold text-ink placeholder:font-medium placeholder:text-muted focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between gap-2 border-t-2 border-[color:var(--line)]/15 pt-2.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                sfxClick();
                setMode("cepat");
              }}
              className={`min-h-8 min-w-0 rounded-lg border-2 px-2.5 text-xs font-extrabold transition ${
                mode === "cepat"
                  ? "border-[#141513] bg-lime text-[#111310]"
                  : "border-transparent bg-bg text-muted hover:text-ink"
              }`}
            >
              {lang === "en" ? "Quick Add" : "Tambah Cepat"}
            </button>
            <button
              type="button"
              onClick={() => {
                sfxClick();
                setMode("ai");
              }}
              className={`min-h-8 min-w-0 rounded-lg border-2 px-2.5 text-xs font-extrabold transition ${
                mode === "ai"
                  ? "border-[#141513] bg-lime text-[#111310]"
                  : "border-transparent bg-bg text-muted hover:text-ink"
              }`}
            >
              {lang === "en" ? "AI Split" : "Pecah Banyak (AI)"}
            </button>
          </div>

          <button
            type="submit"
            disabled={pending || teks.trim().length < 3}
            className="tombol tombol-kecil min-h-8 shrink-0 px-3"
          >
            {pending
              ? "..."
              : mode === "cepat"
                ? lang === "en"
                  ? "Add ↵"
                  : "Tambah ↵"
                : lang === "en"
                  ? "Split ↵"
                  : "Susun ↵"}
          </button>
        </div>

        {pesan && (
          <p
            className={`text-xs font-extrabold ${
              pesan.ok
                ? "text-[color:var(--santai)]"
                : "text-[color:var(--bahaya)]"
            }`}
          >
            {pesan.info}
          </p>
        )}
      </form>
    </div>
  );
}
