"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { hapusTugas, ubahStatus } from "@/server/tasks";
import { pecahLangkahAI } from "@/server/ai-plan";
import FormTugas from "./FormTugas";

export type Langkah = {
  id: string;
  judul: string;
  selesai: boolean;
  info: string;
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

const LABEL = { HIGH: "Tinggi", MEDIUM: "Sedang", LOW: "Santai" } as const;

const AKSEN_PRIORITAS = {
  HIGH: "border-l-[6px] border-l-[color:var(--bahaya)]",
  MEDIUM: "border-l-[6px] border-l-[color:var(--warn-line)]",
  LOW: "border-l-[6px] border-l-[color:var(--santai)]",
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
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className="grid size-11 shrink-0 place-items-center"
    >
      <span
        className={`grid place-items-center rounded-lg border-2 border-ink transition-all ${
          kecil ? "size-5" : "size-7"
        } ${
          on
            ? "scale-95 bg-lime text-[#111] shadow-none"
            : "bg-card shadow-[0_2px_0_var(--sh)]"
        }`}
      >
        {on && (
          <svg
            viewBox="0 0 24 24"
            className="size-4/5"
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

function IkonKecil({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

export default function DaftarTugas({ items }: { items: Item[] }) {
  const [, mulai] = useTransition();
  const [buka, setBuka] = useState<Record<string, boolean>>({});
  const [loadingAI, setLoadingAI] = useState<Record<string, boolean>>({});
  const [infoAI, setInfoAI] = useState<Record<string, string>>({});
  const [edit, setEdit] = useState<Item null |>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  const [peta, setPeta] = useOptimistic<
    Record<string, boolean>,
    { id: string; nilai: boolean }
  >({}, (s, a) => ({ ...s, [a.id]: a.nilai }));

  const on = (id: string, asli: boolean) => (id in peta ? peta[id] : asli);

  function ganti(id: string, asli: boolean) {
    const nilai = !on(id, asli);
    mulai(async () => {
      setPeta({ id, nilai });
      await ubahStatus(id, nilai);
    });
  }

  function hapus(t: Item) {
    if (confirm(`Hapus "${t.judul}"?`)) {
      mulai(async () => {
        await hapusTugas(t.id);
      });
    }
  }

  async function jalankanPecahAI(t: Item) {
    setLoadingAI((s) => ({ ...s, [t.id]: true }));
    setInfoAI((s) => ({ ...s, [t.id]: "" }));
    try {
      const hasil = await pecahLangkahAI(t.id);
      setInfoAI((s) => ({ ...s, [t.id]: hasil.pesan }));
      if (hasil.ok) {
        setBuka((s) => ({ ...s, [t.id]: true }));
      }
    } finally {
      setLoadingAI((s) => ({ ...s, [t.id]: false }));
    }
  }

  function bukaEdit(t: Item) {
    setEdit(t);
    dlg.current?.showModal();
  }

  const tutupEdit = () => dlg.current?.close();

  return (
    <>
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
              className={`kartu kartu-interaktif p-4 ${AKSEN_PRIORITAS[t.prioritas]} ${
                sel ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start gap-2.5">
                <Kotak on="{sel}" onClick="{()"> ganti(t.id, t.selesai)}
                  label={`Tandai selesai: ${t.judul}`}
                />
                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-ink/20 bg-lime-soft px-1.5 py-0.5 text-xs font-extrabold text-ink">
                      #{t.no}
                    </span>
                    <p
                      className={`text-lg font-bold leading-snug ${
                        sel ? "line-through" : ""
                      }`}
                    >
                      {t.judul}
                    </p>
                  </div>

                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm text-muted">
                    <span
                      className={
                        t.telat && !sel
                          ? "rounded bg-[color:var(--bahaya-bg)] px-1.5 py-0.5 font-extrabold text-[color:var(--bahaya)]"
                          : "font-semibold text-ink/80"
                      }
                    >
                      {t.sisa}
                    </span>
                    {t.kategori && (
                      <>
                        <span aria-hidden="true">•</span>
                        <span className="font-medium">{t.kategori}</span>
                      </>
                    )}
                    {t.estimasi && (
                      <>
                        <span aria-hidden="true">•</span>
                        <span>{t.estimasi}</span>
                      </>
                    )}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`tag tag-${t.prioritas}`}>
                      {LABEL[t.prioritas]}
                    </span>
                    {!sel && <span className="tag tag-exp">🔥 +1 streak</span>}

                    {t.langkah.length > 0 ? (
                      <button
                        type="button"
                        aria-expanded={!!buka[t.id]}
                        onClick={() =>
                          setBuka((s) => ({ ...s, [t.id]: !s[t.id] }))
                        }
                        className="inline-flex min-h-8 items-center gap-1.5 rounded-full border-2 border-ink bg-lime-soft px-3 py-0.5 text-xs font-extrabold text-[#111] transition hover:bg-lime"
                      >
                        <span>
                          📋 {dari}/{t.langkah.length} langkah ({persenLangkah}%)
                        </span>
                        <span>{buka[t.id] ? "▴" : "▾"}</span>
                      </button>
                    ) : (
                      !sel && (
                        <button
                          type="button"
                          disabled={sedangAI}
                          onClick={() => jalankanPecahAI(t)}
                          className="inline-flex min-h-8 items-center gap-1 rounded-full border-2 border-ink px-3 py-0.5 text-xs font-extrabold transition hover:-translate-y-0.5 disabled:opacity-50"
                          style={{
                            background: "var(--ai-bg)",
                            color: "var(--ai-ink)",
                          }}
                        >
                          {sedangAI
                            ? "⏳ Mate lagi mecah langkah..."
                            : "✨ Pecah Langkah AI"}
                        </button>
                      )
                    )}
                  </div>

                  {infoAI[t.id] && (
                    <p className="mt-2 text-xs font-bold text-biru">
                      {infoAI[t.id]}
                    </p>
                  )}
                </div>

                <div className="hidden shrink-0 flex-col items-end gap-2 border-l-2 border-ink/15 pl-4 sm:flex">
                  <span className="text-xs font-semibold text-muted">
                    {t.tenggat}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => ganti(t.id, t.selesai)}
                      className="tombol tombol-kecil"
                    >
                      {sel ? "Batalkan" : "Selesai"}
                    </button>
                    <button
                      type="button"
                      onClick={() => bukaEdit(t)}
                      className="tombol tombol-putih tombol-kecil"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => hapus(t)}
                      className="tombol tombol-kecil"
                      style={{
                        background: "var(--bahaya-bg)",
                        color: "var(--bahaya)",
                      }}
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                <div className="flex shrink-0 sm:hidden">
                  <button
                    type="button"
                    onClick={() => bukaEdit(t)}
                    aria-label={`Edit ${t.judul}`}
                    className="grid size-11 place-items-center text-muted"
                  >
                    <IkonKecil d="M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4"/>
                  </button>
                  <button
                    type="button"
                    onClick={() => hapus(t)}
                    aria-label={`Hapus ${t.judul}`}
                    className="grid size-11 place-items-center text-muted"
                  >
                    <IkonKecil d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>
                  </button>
                </div>
              </div>

              {buka[t.id] && t.langkah.length > 0 && (
                <div className="mt-3.5 rounded-xl border-2 border-ink/20 bg-bg/60 p-3">
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wide text-muted">
                      Rencana Langkah Mate ({dari}/{t.langkah.length} tuntas)
                    </span>
                    {!sel && (
                      <button
                        type="button"
                        disabled={sedangAI}
                        onClick={() => jalankanPecahAI(t)}
                        className="min-h-0 text-xs font-bold underline underline-offset-2 opacity-80 hover:opacity-100"
                      >
                        {sedangAI ? "Menyusun ulang..." : "↻ Susun ulang AI"}
                      </button>
                    )}
                  </div>
                  <div className="mb-3 h-2 overflow-hidden rounded-full border border-ink bg-card">
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
                          className="flex items-center gap-2 rounded-lg bg-card/80 px-2 py-1"
                        >
                          <Kotak kecil on="{ls}" onClick="{()"> ganti(l.id, l.selesai)}
                            label={`Tandai selesai: ${l.judul}`}
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm font-semibold leading-snug ${
                                ls ? "line-through opacity-55" : ""
                              }`}
                            >
                              <span className="mr-1.5 text-xs font-extrabold text-muted">
                                {idx + 1}.
                              </span>
                              {l.judul}
                            </p>
                            <p className="text-xs text-muted">{l.info}</p>
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

      <dialog
        ref={dlg}
        onClick={(e) => {
          if (e.target === dlg.current) tutupEdit();
        }}
        onClose={() => setEdit(null)}
        className="m-auto max-h-[92dvh] w-[min(94vw,34rem)] overflow-y-auto rounded-2xl border-2 border-ink bg-card p-0 text-ink shadow-[0_6px_0_var(--sh)] backdrop:bg-black/50"
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
                aria-label="Tutup"
                className="grid size-11 place-items-center rounded-xl border-2 border-ink"
              >
                <IkonKecil d="M6 6l12 12M18 6L6 18"/>
              </button>
            </div>
            <FormTugas "Kuliah", ?? awal="{{" edit.estimasiJam, edit.id, edit.jam, edit.judul, edit.kategori edit.prioritas, edit.tanggal, estimasiJam: id: jam: judul: kategori: key="{edit.id}" onBatal="{tutupEdit}" onSelesai="{tutupEdit}" prioritas: tanggal: }}/>
          </div>
        )}
      </dialog>
    </>
  );
}