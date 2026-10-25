"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { RencanaForm } from "@/components/paper/RencanaForm";
import FormTugas from "@/components/tugas/FormTugas";
import { lewatiDeadline, majukanHari } from "@/server/demo";
import { isSfxEnabled, sfxClick, toggleSfx } from "@/lib/sfx";
import { useTema } from "./tema";

const IKON: Record<string, string> = {
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  progress: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  kalender: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  profil: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-7 8-7s8 3 8 7",
  plus: "M12 5v14M5 12h14",
  bulan: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  suaraOn: "M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 010 7M19 6a9 9 0 010 12",
  suaraOff: "M11 5L6 9H2v6h4l5 4V5zM22 9l-6 6M16 9l6 6",
  sparkle: "M12 3l1.9 5.8L20 10.8l-6.1 1.9L12 18.5l-1.9-5.8L4 10.8l6.1-2z",
  x: "M6 6l12 12M18 6L6 18",
};

function I({ n, className = "size-5" }: { n: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={IKON[n]} />
    </svg>
  );
}

const NAV = [
  { href: "/today", label: "Home", ikon: "home" },
  { href: "/progress", label: "Progress", ikon: "progress" },
  { href: "/kalender", label: "Kalender", ikon: "kalender" },
  { href: "/profil", label: "Profil", ikon: "profil" },
];

const JUDUL: Record<string, string> = {
  "/today": "Dashboard",
  "/progress": "Progress",
  "/kalender": "Kalender",
  "/profil": "Profil",
};

type Props = {
  nama: string;
  streak: number;
  level: number;
  exp: number;
  hariIni: { selesai: number; total: number };
  terlewat: { id: string; judul: string } | null;
  demo: boolean;
  children: ReactNode;
};

export default function AppShell({
  nama,
  streak,
  level,
  exp,
  hariIni,
  terlewat,
  demo,
  children,
}: Props) {
  const path = usePathname();
  const dlg = useRef<HTMLDialogElement>(null);
  const putus = useRef<HTMLDialogElement>(null);
  const [, setTema] = useTema();
  const [pending, mulai] = useTransition();
  const [panelDemo, setPanelDemo] = useState(true);
  const [kunci, setKunci] = useState(0);
  const [tabModal, setTabModal] = useState<"satuan" | "banyak">("satuan");
  const [sfxAktif, setSfxAktif] = useState(true);

  useEffect(() => {
    setSfxAktif(isSfxEnabled());
  }, []);

  const bukaTugas = () => {
    sfxClick();
    dlg.current?.showModal();
  };
  const tutupTugas = () => dlg.current?.close();

  const gantiTema = () => {
    sfxClick();
    setTema(
      document.documentElement.dataset.theme === "dark" ? "terang" : "gelap",
    );
  };

  const ubahSuara = () => {
    setSfxAktif(toggleSfx());
  };

  const inisial = nama.slice(0, 1).toUpperCase();

  useEffect(() => {
    if (!terlewat) return;
    try {
      if (localStorage.getItem(`putus:${terlewat.id}`)) return;
    } catch {}
    if (!putus.current?.open) putus.current?.showModal();
  }, [terlewat]);

  function tandaiPutus() {
    if (!terlewat) return;
    try {
      localStorage.setItem(`putus:${terlewat.id}`, "1");
    } catch {}
  }

  const bar = (
    <div className="h-2.5 overflow-hidden rounded-full border-2 border-[color:var(--line)] bg-card">
      <div
        className="h-full bg-biru transition-all duration-300"
        style={{ width: `${exp}%` }}
      />
    </div>
  );

  return (
    <>
      <a
        href="#isi"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-lime focus:px-4 focus:py-3 focus:font-bold focus:text-[#111]"
      >
        Lompat ke isi
      </a>

      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col justify-between border-r-2 border-[color:var(--line)] bg-card p-4 lg:flex">
        <div className="flex flex-col gap-6">
          <Link href="/today" className="flex items-center gap-2.5 px-1 py-2">
            <span className="grid size-10 place-items-center rounded-xl border-2 border-[color:var(--line)] bg-lime text-lg font-extrabold text-[#111] shadow-[0_3px_0_var(--sh)]">
              D
            </span>
            <div className="leading-tight">
              <span className="block text-lg font-extrabold tracking-tight">
                Deadline Mate
              </span>
              <span className="text-[11px] font-bold text-muted">
                AI Study Partner
              </span>
            </div>
          </Link>

          <nav aria-label="Utama" className="flex flex-col gap-2">
            {NAV.map((n) => {
              const aktif = path === n.href;
              const navCls = aktif
                ? "flex min-h-12 items-center gap-3 rounded-xl border-2 border-[color:var(--line)] bg-lime px-3.5 font-bold text-[#111] shadow-[0_3px_0_var(--sh)] transition-all"
                : "flex min-h-12 items-center gap-3 rounded-xl border-2 border-transparent px-3.5 font-bold text-ink/80 transition-all hover:border-[color:var(--line)]/40 hover:bg-bg hover:text-ink";
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => sfxClick()}
                  aria-current={aktif ? "page" : undefined}
                  className={navCls}
                >
                  <I n={n.ikon} />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <button type="button" onClick={bukaTugas} className="tombol w-full">
            <I n="plus" /> Tugas baru
          </button>
        </div>

        <div className="kartu-lime p-3.5 text-xs">
          <div className="flex items-center gap-1.5 font-extrabold">
            <I n="sparkle" className="size-4" />
            <span>Tips Produktif</span>
          </div>
          <p className="mt-1.5 leading-relaxed opacity-90">
            Tugas terasa berat? Gunakan tombol <strong>Pecah Langkah AI</strong>{" "}
            pada kartu tugas untuk membaginya jadi cicilan pendek.
          </p>
        </div>
      </aside>

      <div className="lg:pl-56">
        {/* Header desktop */}
        <header className="sticky top-0 z-20 hidden h-20 items-center justify-between border-b-2 border-[color:var(--line)] bg-card/95 px-8 backdrop-blur-sm lg:flex">
          <h2 className="text-2xl font-extrabold">
            <span className="judul-stabilo">
              {JUDUL[path] ?? "DeadlineMate"}
            </span>
          </h2>
          <div className="flex items-center gap-2.5">
            <span
              className="tag px-3 py-1"
              style={{
                background: "var(--lime-soft)",
                color: "var(--lime-soft-ink)",
                borderColor: "var(--line)",
                fontSize: "0.8125rem",
              }}
            >
              Streak {streak}
            </span>

            <button
              type="button"
              onClick={ubahSuara}
              aria-label={
                sfxAktif ? "Matikan efek suara" : "Nyalakan efek suara"
              }
              title={sfxAktif ? "Sound FX: Aktif" : "Sound FX: Mati"}
              className="grid size-11 place-items-center rounded-xl border-2 border-[color:var(--line)] bg-card transition hover:-translate-y-0.5"
            >
              <I n={sfxAktif ? "suaraOn" : "suaraOff"} />
            </button>

            <button
              type="button"
              onClick={gantiTema}
              aria-label="Ganti tema"
              title="Ganti tema Terang/Gelap"
              className="grid size-11 place-items-center rounded-xl border-2 border-[color:var(--line)] bg-card transition hover:-translate-y-0.5"
            >
              <I n="bulan" />
            </button>

            <div className="ml-1 text-right leading-tight">
              <p className="font-bold">Hai, {nama}!</p>
              <p className="text-xs font-semibold text-muted">
                Lvl {level} · {exp} EXP
              </p>
            </div>
            <span className="grid size-11 place-items-center rounded-full border-2 border-[color:var(--line)] bg-lime font-extrabold text-[#111] shadow-[0_2px_0_var(--sh)]">
              {inisial}
            </span>
          </div>
        </header>

        {/* Header mobile */}
        <header className="border-b-2 border-[color:var(--line)] bg-card px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] lg:hidden">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-muted">Selamat datang</p>
              <h2 className="text-2xl font-extrabold leading-tight">
                Hai, {nama}!
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="tag"
                style={{
                  background: "var(--lime-soft)",
                  color: "var(--lime-soft-ink)",
                  borderColor: "var(--line)",
                  fontSize: "0.8125rem",
                }}
              >
                Streak {streak}
              </span>
              <button
                type="button"
                onClick={ubahSuara}
                aria-label="Efek suara"
                className="grid size-10 place-items-center rounded-xl border-2 border-[color:var(--line)]"
              >
                <I n={sfxAktif ? "suaraOn" : "suaraOff"} className="size-4" />
              </button>
              <button
                type="button"
                onClick={gantiTema}
                aria-label="Ganti tema"
                className="grid size-10 place-items-center rounded-xl border-2 border-[color:var(--line)]"
              >
                <I n="bulan" className="size-4" />
              </button>
            </div>
          </div>
          <p className="mt-2 text-sm font-bold">
            Lvl {level}{" "}
            <span className="font-normal text-muted">· {exp} EXP</span>
          </p>
          <div className="mt-1">{bar}</div>
        </header>

        <main
          id="isi"
          className="mx-auto w-full max-w-6xl px-4 pb-32 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8"
        >
          {children}
        </main>
      </div>

      {/* Bottom nav mobile */}
      <nav
        aria-label="Utama"
        className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-[color:var(--line)] bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="grid grid-cols-5 items-end px-2 pb-2 pt-1">
          {[NAV[0], NAV[1], null, NAV[2], NAV[3]].map((n, i) => {
            if (!n) {
              return (
                <li key={`fab-${i}`} className="flex justify-center">
                  <button
                    type="button"
                    onClick={bukaTugas}
                    aria-label="Tugas baru"
                    className="-mt-8 grid size-16 place-items-center rounded-full border-2 border-[color:var(--line)] bg-lime text-[#111] shadow-[0_4px_0_var(--sh)] active:translate-y-1 active:shadow-none"
                  >
                    <I n="plus" className="size-8" />
                  </button>
                </li>
              );
            }
            const aktifMobile = path === n.href;
            const mobileCls = aktifMobile
              ? "mx-auto flex min-h-14 w-full max-w-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-[color:var(--line)] bg-lime text-xs font-bold text-[#111]"
              : "mx-auto flex min-h-14 w-full max-w-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-bold";
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  onClick={() => sfxClick()}
                  aria-current={aktifMobile ? "page" : undefined}
                  className={mobileCls}
                >
                  <I n={n.ikon} />
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Dialog tugas baru dengan Tab Switcher bersih */}
      <dialog
        ref={dlg}
        onClick={(e) => {
          if (e.target === dlg.current) tutupTugas();
        }}
        onClose={() => setKunci((k) => k + 1)}
        className="m-auto max-h-[92dvh] w-[min(94vw,34rem)] overflow-y-auto rounded-2xl border-2 border-[color:var(--line)] bg-card p-0 text-ink shadow-[0_6px_0_var(--sh)] backdrop:bg-black/60"
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-2xl font-extrabold">
              <span className="judul-stabilo">Tugas baru</span>
            </h2>
            <button
              type="button"
              onClick={tutupTugas}
              aria-label="Tutup"
              className="grid size-11 place-items-center rounded-xl border-2 border-[color:var(--line)]"
            >
              <I n="x" />
            </button>
          </div>

          {/* Segmented Tab Switcher agar tidak menumpuk 2 kotak hijau */}
          <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-xl border-2 border-[color:var(--line)] bg-bg p-1">
            <button
              type="button"
              onClick={() => {
                sfxClick();
                setTabModal("satuan");
              }}
              className={`min-h-10 rounded-lg text-xs font-extrabold transition ${
                tabModal === "satuan"
                  ? "border-2 border-[color:var(--line)] bg-lime text-[#111] shadow-[0_2px_0_var(--sh)]"
                  : "text-muted hover:text-ink"
              }`}
            >
              Satu Tugas (Auto-Fill)
            </button>
            <button
              type="button"
              onClick={() => {
                sfxClick();
                setTabModal("banyak");
              }}
              className={`min-h-10 rounded-lg text-xs font-extrabold transition ${
                tabModal === "banyak"
                  ? "border-2 border-[color:var(--line)] bg-lime text-[#111] shadow-[0_2px_0_var(--sh)]"
                  : "text-muted hover:text-ink"
              }`}
            >
              Smart Scheduler (Banyak)
            </button>
          </div>

          <div className="mt-4">
            {tabModal === "satuan" ? (
              <FormTugas
                key={kunci}
                onSelesai={tutupTugas}
                onBatal={tutupTugas}
              />
            ) : (
              <section className="kartu-lime p-4">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="font-extrabold">
                    Tulis semua tugasmu sekaligus
                  </h3>
                  <span className="rounded-full border border-[color:var(--line)] bg-card px-2 py-0.5 text-[11px] font-extrabold text-ink">
                    Multi-Task AI
                  </span>
                </div>
                <p className="mb-3 text-xs opacity-85">
                  Ketik beberapa jadwal kuliah/organisasi dalam satu paragraf.
                  Mate akan memecahnya jadi daftar tugas + sub-langkah otomatis.
                </p>
                <RencanaForm />
              </section>
            )}
          </div>
        </div>
      </dialog>

      {/* Dialog streak putus */}
      <dialog
        ref={putus}
        onClose={tandaiPutus}
        className="m-auto w-[min(92vw,24rem)] rounded-2xl border-2 border-[color:var(--line)] bg-card p-6 text-center text-ink shadow-[0_6px_0_var(--sh)] backdrop:bg-black/60"
      >
        <span
          className="mx-auto grid size-14 place-items-center rounded-full border-2 border-[color:var(--line)] text-xl font-extrabold"
          style={{ background: "var(--bahaya-bg)", color: "var(--bahaya)" }}
        >
          !
        </span>
        <h2 className="mt-3 text-xl font-extrabold">Streak terputus</h2>
        <p className="mt-1 text-sm text-muted">
          Deadline terlewat pada tugas:{" "}
          <strong className="text-ink">{terlewat?.judul}</strong>
        </p>
        <button
          type="button"
          onClick={() => {
            sfxClick();
            putus.current?.close();
          }}
          className="tombol mt-5 w-full"
        >
          Mulai bangkit lagi
        </button>
      </dialog>

      {/* Mode demo */}
      {demo &&
        (panelDemo ? (
          <div className="fixed bottom-24 right-3 z-50 w-56 rounded-2xl border-2 border-[color:var(--line)] bg-card p-3 shadow-[0_4px_0_var(--sh)] lg:bottom-6 lg:right-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-extrabold uppercase tracking-wider text-muted">
                Simulasi Demo
              </p>
              <button
                type="button"
                onClick={() => {
                  sfxClick();
                  setPanelDemo(false);
                }}
                aria-label="Sembunyikan mode demo"
                className="grid size-8 min-h-0 min-w-0 place-items-center rounded-lg border border-[color:var(--line)]/20 hover:bg-bg"
              >
                <I n="x" className="size-4" />
              </button>
            </div>
            <div className="grid gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  sfxClick();
                  mulai(async () => void (await majukanHari()));
                }}
                className="tombol tombol-putih tombol-kecil"
              >
                Majukan waktu 1 hari
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  sfxClick();
                  mulai(async () => void (await lewatiDeadline()));
                }}
                className="tombol tombol-putih tombol-kecil"
              >
                Lewati deadline #1
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              sfxClick();
              setPanelDemo(true);
            }}
            className="tombol tombol-kecil fixed bottom-24 right-3 z-50 lg:bottom-6 lg:right-6"
          >
            Simulasi Demo
          </button>
        ))}
    </>
  );
}
