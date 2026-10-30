"use client";

import { useRef } from "react";
import { keluarAkunBaru } from "@/server/auth-actions";
import { Icon } from "@/components/ui/Icon";

export default function ZonaBahaya() {
  const dlgLogout = useRef<HTMLDialogElement>(null);

  return (
    <>
      <section className="kartu p-5 bg-[color:var(--bahaya-bg)] border-2 border-[color:var(--bahaya)] shadow-[0_4px_0_var(--bahaya)]">
        <h3 className="font-extrabold text-[color:var(--bahaya)] text-sm mb-1 uppercase tracking-wider">
          Zona Berbahaya
        </h3>
        <p className="text-[11px] font-semibold text-[color:var(--bahaya)]/80 mb-3">
          Sesi lo akan berakhir. Pastikan semua tugas udah disimpan.
        </p>

        <button
          type="button"
          onClick={() => dlgLogout.current?.showModal()}
          className="w-full rounded-xl border-2 border-[color:var(--bahaya)] bg-card py-2 text-xs font-black text-[color:var(--bahaya)] shadow-[0_2px_0_var(--bahaya)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
        >
          Keluar dari Akun
        </button>
      </section>

      <dialog
        ref={dlgLogout}
        onClick={(e) => {
          if (e.target === dlgLogout.current) dlgLogout.current?.close();
        }}
        // FIX: Ganti bg-[color:var(--surface-raised)] jadi bg-card
        className="m-auto w-[min(92vw,24rem)] rounded-2xl border-2 border-[color:var(--line)] bg-card p-5 text-ink shadow-[0_6px_0_var(--sh)] backdrop:bg-black/60"
      >
        <div className="flex items-center gap-3">
          <span
            className="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-[color:var(--line)]"
            style={{ background: "var(--bahaya-bg)", color: "var(--bahaya)" }}
          >
            <Icon name="logout" />
          </span>
          <div>
            <h3 className="text-lg font-extrabold">Yakin mau keluar?</h3>
            <p className="text-xs text-muted">
              Pastikan semua tugasmu udah disimpan ya.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => dlgLogout.current?.close()}
            className="tombol tombol-putih"
          >
            Batal
          </button>
          <form action={keluarAkunBaru} className="w-full">
            <button
              type="submit"
              className="tombol w-full"
              style={{ background: "var(--bahaya-bg)", color: "var(--bahaya)" }}
            >
              Ya, Keluar
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
