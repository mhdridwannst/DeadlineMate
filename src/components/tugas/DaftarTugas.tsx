"use client";

import {
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import confetti from "canvas-confetti";
import { hapusTugas, ubahStatus } from "@/server/tasks";
import { pecahLangkahAI } from "@/server/ai-plan";
import { sfxAiSuccess, sfxCheck, sfxClick, sfxDelete } from "@/lib/sfx";
import FormTugas from "./FormTugas";

export type Langkah = {
  id: string;
  judul: string;
  selesai: boolean;
  info: string;
  menit?: number;
};

export type Item = {
  id: string;
  no: number;
  judul: string;
  selesai: boolean;
  prioritas: "HIGH" | "MEDIUM" | "LOW";
  kategori: string | null;
  estimasi: string | null;
  estimasiJam: number;
  tanggal: string;
  jam: string;
  sisa: string;
  tenggat: string;
  telat: boolean;
  langkah: Langkah[];
};

const LABEL = {
  HIGH: "Tinggi",
  MEDIUM: "Sedang",
  LOW: "Santai",
} as const;

const AKSEN_PRIORITAS = {
  HIGH: "!border-l-[6px] !border-l-[color:var(--bahaya)]",
  MEDIUM: "!border-l-[6px] !border-l-[color:var(--warn-line)]",
  LOW: "!border-l-[6px] !border-l-[color:var(--santai)]",
} as const;

function Kotak({
  on,
  onClick,
  label,
  kecil,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
  kecil?: boolean;
}) {
  const ukuranCls = kecil ? "size-5 rounded-md" : "size-6 rounded-lg";
  const warnaCls = on
    ? "border-[#111] bg-lime text-[#111]"
    : "border-[color:var(--line)] bg-[color:var(--surface)] hover:border-biru";

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className="grid size-9 min-h-0 min-w-0 shrink-0 place-items-center"
    >
      <span
        className={`grid place-items-center border-2 transition-all duration-150 ${ukuranCls} ${warnaCls}`}
      >
        {on && (
          <svg
            viewBox="0 0 24 24"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12l5 5 9-10" />
          </svg>
        )}
      </span>
    </button>
  );
}

function IkonKecil({
  d,
  className = "size-4",
}: {
  d: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

export default function DaftarTugas({
  items,
  tampilkanHeader = false,
  tanggalPanjang = "",
}: {
  items: Item[];
  tampilkanHeader?: boolean;
  tanggalPanjang?: string;
}) {
  const [sedangHapus, mulai] = useTransition();
  const [buka, setBuka] = useState<Record<string, boolean>>({});
  const [loadingAI, setLoadingAI] = useState<Record<string, boolean>>({});
  const [infoAI, setInfoAI] = useState<Record<string, string>>({});
  const [edit, setEdit] = useState<Item | null>(null);
  const [targetHapus, setTargetHapus] = useState<Item | null>(null);

  // State untuk Popup AI
  const [aiNote, setAiNote] = useState<string | null>(null);
  const dlgAi = useRef<HTMLDialogElement>(null);

  // State untuk animasi melayang +10 XP
  const [floatingXP, setFloatingXP] = useState<Record<string, boolean>>({});

  const dlg = useRef<HTMLDialogElement>(null);
  const dlgHapus = useRef<HTMLDialogElement>(null);

  const [peta, setPeta] = useOptimistic<
    Record<string, boolean>,
    { id: string; nilai: boolean }
  >({}, (s, a) => ({ ...s, [a.id]: a.nilai }));
  const on = (id: string, asli: boolean) => (id in peta ? peta[id] : asli);

  function ganti(id: string, asli: boolean, parentId: string | null = null) {
    const nilai = !on(id, asli);
    sfxCheck(nilai);

    if (nilai && !parentId) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#a8f000", "#111111", "#ffffff", "#2563eb"],
        disableForReducedMotion: true,
      });

      setFloatingXP((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setFloatingXP((prev) => ({ ...prev, [id]: false }));
      }, 1000);
    }

    mulai(async () => {
      setPeta({ id, nilai });
      await ubahStatus(id, nilai, parentId);
    });
  }

  function mintaHapus(t: Item) {
    sfxClick();
    setTargetHapus(t);
    dlgHapus.current?.showModal();
  }
  function tutupHapus() {
    dlgHapus.current?.close();
  }
  function eksekusiHapus() {
    if (!targetHapus) return;
    const id = targetHapus.id;
    sfxDelete();
    dlgHapus.current?.close();
    mulai(async () => {
      await hapusTugas(id);
      setTargetHapus(null);
    });
  }

  async function jalankanPecahAI(t: Item) {
    sfxClick();
    setLoadingAI((s) => ({ ...s, [t.id]: true }));
    setInfoAI((s) => ({ ...s, [t.id]: "" }));
    try {
      const hasil = await pecahLangkahAI(t.id);
      setInfoAI((s) => ({ ...s, [t.id]: hasil.pesan }));
      if (hasil.ok) {
        sfxAiSuccess();
        setBuka((s) => ({ ...s, [t.id]: true }));

        // MUNCULKAN POPUP KALAU ADA CATATAN
        if (hasil.catatan) {
          setAiNote(hasil.catatan);
          dlgAi.current?.showModal();
        }
      }
    } finally {
      setLoadingAI((s) => ({ ...s, [t.id]: false }));
    }
  }

  function bukaEdit(t: Item) {
    sfxClick();
    setEdit(t);
    dlg.current?.showModal();
  }
  const tutupEdit = () => dlg.current?.close();

  return (
    <>
      {tampilkanHeader && (
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted">{tanggalPanjang}</p>
              <h1 className="text-2xl font-extrabold text-ink sm:text-[28px]">
                <span className="judul-stabilo">Daftar tugas</span>
              </h1>
            </div>
          </div>
        </div>
      )}

      <ul className="space-y-4">
        {items.map((t) => {
          const sel = on(t.id, t.selesai);
          const dari = t.langkah.filter((l) => on(l.id, l.selesai)).length;
          const sedangAI = !!loadingAI[t.id];
          const persenLangkah =
            t.langkah.length > 0
              ? Math.round((dari / t.langkah.length) * 100)
              : 0;

          return (
            <li
              key={t.id}
              className={`kartu p-4 transition-opacity relative ${AKSEN_PRIORITAS[t.prioritas]} ${sel ? "opacity-55" : ""}`}
            >
              {/* Animasi Floating +10 XP */}
              {floatingXP[t.id] && (
                <span className="absolute top-2 right-12 text-biru font-black text-sm animate-bounce z-10 pointer-events-none drop-shadow-md">
                  +10 EXP ✨
                </span>
              )}

              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <Kotak
                    on={sel}
                    onClick={() => ganti(t.id, t.selesai, null)}
                    label={`Tandai selesai: ${t.judul}`}
                  />

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-base font-bold leading-snug ${sel ? "line-through text-muted" : "text-ink"}`}
                    >
                      <span className="mr-1.5 font-extrabold text-biru">
                        #{t.no}
                      </span>
                      {t.judul}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                      <span
                        className={
                          t.telat && !sel
                            ? "font-bold text-[color:var(--bahaya)]"
                            : ""
                        }
                      >
                        {t.sisa}
                      </span>
                      {t.kategori && (
                        <>
                          <span>•</span>
                          <span>{t.kategori}</span>
                        </>
                      )}
                      {t.estimasi && (
                        <>
                          <span>•</span>
                          <span>{t.estimasi}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="hidden sm:block shrink-0 text-right">
                    <span className="text-[11px] font-medium text-muted">
                      {t.tenggat}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-[color:var(--line)]/10 pt-3 mt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`tag tag-${t.prioritas}`}>
                      {LABEL[t.prioritas]}
                    </span>
                    {!sel && <span className="tag tag-exp">🔥 +1 streak</span>}

                    {/* LOGIKA AI: Skeleton Loading */}
                    {sedangAI ? (
                      <div className="inline-flex min-h-7 items-center gap-2 rounded-full border-2 border-[color:var(--line)] bg-[color:var(--ai-bg)] px-3 py-1">
                        <div className="flex space-x-1 animate-pulse">
                          <div className="size-1.5 bg-[color:var(--ai-ink)] rounded-full"></div>
                          <div className="size-1.5 bg-[color:var(--ai-ink)] rounded-full"></div>
                          <div className="size-1.5 bg-[color:var(--ai-ink)] rounded-full"></div>
                        </div>
                        <span className="text-[11px] font-bold text-[color:var(--ai-ink)]">
                          Mate menyusun...
                        </span>
                      </div>
                    ) : t.langkah.length > 0 ? (
                      <button
                        type="button"
                        aria-expanded={!!buka[t.id]}
                        onClick={() => {
                          sfxClick();
                          setBuka((s) => ({ ...s, [t.id]: !s[t.id] }));
                        }}
                        className="inline-flex min-h-7 items-center gap-1 rounded-full border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] px-2.5 py-0.5 text-[11px] font-bold text-ink transition hover:bg-lime-soft"
                      >
                        <span>
                          {dari}/{t.langkah.length} langkah
                        </span>
                        <span>{buka[t.id] ? "▴" : "▾"}</span>
                      </button>
                    ) : (
                      !sel && (
                        <button
                          type="button"
                          onClick={() => jalankanPecahAI(t)}
                          className="inline-flex min-h-7 items-center gap-1 rounded-full border-2 border-[color:var(--line)] bg-[color:var(--ai-bg)] px-2.5 py-0.5 text-[11px] font-bold text-[color:var(--ai-ink)] transition hover:opacity-90"
                        >
                          <span>✦ Pecah Langkah AI</span>
                        </button>
                      )
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => bukaEdit(t)}
                      aria-label={`Edit ${t.judul}`}
                      className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border-2 border-[#111] bg-lime px-3 py-1 text-xs font-extrabold text-[#111] shadow-[0_2px_0_var(--sh)] transition active:translate-y-0.5 active:shadow-none"
                    >
                      <IkonKecil
                        d="M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4"
                        className="size-3.5"
                      />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => mintaHapus(t)}
                      aria-label={`Hapus ${t.judul}`}
                      className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border-2 border-[#111] px-3 py-1 text-xs font-extrabold shadow-[0_2px_0_var(--sh)] transition active:translate-y-0.5 active:shadow-none"
                      style={{
                        background: "var(--bahaya-bg)",
                        color: "var(--bahaya)",
                      }}
                    >
                      <IkonKecil
                        d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"
                        className="size-3.5"
                      />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>

              {infoAI[t.id] && (
                <p className="mt-3 rounded-lg bg-[color:var(--ai-bg)] px-3 py-2 text-xs font-bold text-[color:var(--ai-ink)]">
                  {infoAI[t.id]}
                </p>
              )}

              {buka[t.id] && t.langkah.length > 0 && (
                <div className="mt-3.5 rounded-xl border-2 border-[color:var(--line)]/30 bg-[color:var(--surface-2)] p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-muted">
                      Sub-langkah AI ({dari}/{t.langkah.length} ·{" "}
                      {persenLangkah}%)
                    </span>
                    {!sel && !sedangAI && (
                      <button
                        type="button"
                        onClick={() => jalankanPecahAI(t)}
                        className="min-h-0 text-xs font-bold text-ink underline underline-offset-2 opacity-80 hover:opacity-100"
                      >
                        ↻ Susun ulang
                      </button>
                    )}
                  </div>
                  <div className="mb-3 h-2 overflow-hidden rounded-full border border-[color:var(--line)] bg-[color:var(--surface)]">
                    <div
                      className="h-full bg-lime transition-all duration-300"
                      style={{ width: `${persenLangkah}%` }}
                    />
                  </div>
                  <ol className="space-y-1.5">
                    {t.langkah.map((l, idx) => {
                      const ls = on(l.id, l.selesai);
                      return (
                        <li
                          key={l.id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-[color:var(--line)]/25 bg-[color:var(--surface)] px-2.5 py-1.5"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <Kotak
                              kecil
                              on={ls}
                              onClick={() => ganti(l.id, l.selesai, t.id)}
                              label={`Tandai selesai: ${l.judul}`}
                            />
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-xs font-bold leading-snug sm:text-sm ${ls ? "line-through text-muted" : "text-ink"}`}
                              >
                                <span className="mr-1.5 font-mono text-xs text-muted">
                                  {idx + 1}.
                                </span>
                                {l.judul}
                              </p>
                              <p className="text-[11px] text-muted">{l.info}</p>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* ================= DIALOG POPUP AI ================= */}
      <dialog
        ref={dlgAi}
        onClick={(e) => {
          if (e.target === dlgAi.current) dlgAi.current?.close();
        }}
        onClose={() => setAiNote(null)}
        className="m-auto w-[min(92vw,26rem)] rounded-2xl border-2 border-[color:var(--line)] bg-[color:var(--surface-raised)] p-5 text-ink shadow-[0_6px_0_var(--sh)] backdrop:bg-black/60"
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg border-2 border-[#111] bg-lime text-sm">
              🤖
            </span>
            <h3 className="text-base font-black text-ink">Pesan dari Mate</h3>
          </div>
          <button
            type="button"
            onClick={() => dlgAi.current?.close()}
            className="grid size-8 place-items-center rounded-lg border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] hover:bg-lime"
          >
            ✕
          </button>
        </div>

        <div className="relative bg-[color:var(--surface-2)] border-2 border-[color:var(--line)] rounded-xl p-4 shadow-[0_3px_0_var(--sh)]">
          <p className="text-sm font-bold leading-relaxed text-ink">
            “{aiNote}”
          </p>
        </div>

        <button
          type="button"
          onClick={() => dlgAi.current?.close()}
          className="tombol w-full mt-4"
        >
          Gas, Mulai Kerjain! 🚀
        </button>
      </dialog>

      {/* Modal Hapus & Edit */}
      <dialog
        ref={dlgHapus}
        className="m-auto w-[min(92vw,24rem)] rounded-2xl border-2 border-[color:var(--line)] bg-[color:var(--surface-raised)] p-5 text-ink shadow-[0_6px_0_var(--sh)] backdrop:bg-black/60"
      >
        {targetHapus && (
          <div>
            <h3 className="text-lg font-extrabold">Hapus tugas ini?</h3>
            <p className="mt-1 text-xs text-muted">
              “{targetHapus.judul}” akan dihapus permanen.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={tutupHapus}
                className="tombol tombol-putih"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={sedangHapus}
                onClick={eksekusiHapus}
                className="tombol"
                style={{
                  background: "var(--bahaya-bg)",
                  color: "var(--bahaya)",
                }}
              >
                {sedangHapus ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        )}
      </dialog>

      <dialog
        ref={dlg}
        className="m-auto max-h-[92dvh] w-[min(94vw,34rem)] overflow-y-auto rounded-2xl border-2 border-[color:var(--line)] bg-[color:var(--surface-raised)] p-0 text-ink shadow-[0_6px_0_var(--sh)] backdrop:bg-black/60"
      >
        {edit && (
          <div className="p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="text-2xl font-extrabold">
                <span className="judul-stabilo">Edit tugas</span>
              </h2>
              <button
                type="button"
                onClick={tutupEdit}
                className="grid size-10 place-items-center rounded-xl border-2 border-[color:var(--line)]"
              >
                ✕
              </button>
            </div>
            <FormTugas
              key={edit.id}
              awal={{
                id: edit.id,
                judul: edit.judul,
                tanggal: edit.tanggal,
                jam: edit.jam,
                kategori: edit.kategori ?? "Kuliah",
                estimasiJam: edit.estimasiJam,
                prioritas: edit.prioritas,
              }}
              onSelesai={tutupEdit}
              onBatal={tutupEdit}
            />
          </div>
        )}
      </dialog>
    </>
  );
}
