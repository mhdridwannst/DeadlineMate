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
import { keluarAkun, masukAkun, setBahasa } from "@/server/demo-user";
import { isSfxEnabled, sfxClick, toggleSfx } from "@/lib/sfx";
import { DICT, type Lang } from "@/lib/i18n";
import DeadlineNotifier, { type ItemNotif } from "./DeadlineNotifier";
import { useTema } from "./tema";

const IKON: Record<string, string> = {
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  progress: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  kalender: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  profil: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-7 8-7s8 3 8 7",
  plus: "M12 5v14M5 12h14",
  bulan: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
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

type Props = {
  nama: string;
  email?: string;
  lang?: Lang;
  notifikasi?: ItemNotif[];
  streak: number;
  level: number;
  exp: number;
  hariIni: { selesai: number; total: number };
  terlewat?: { id: string; judul: string } | null;
  demo?: boolean;
  children: ReactNode;
};

export default function AppShell({
  nama,
  email = "demo@deadlinemate.app",
  lang = "id",
  notifikasi = [],
  streak,
  level,
  exp,
  children,
}: Props) {
  const t = DICT[lang];
  const path = usePathname();

  // Refs untuk Dialog
  const dlg = useRef<HTMLDialogElement>(null);
  const dlgAkun = useRef<HTMLDialogElement>(null);
  const dlgLogout = useRef<HTMLDialogElement>(null);

  const [, setTema] = useTema();
  const [, mulai] = useTransition();

  const [kunci, setKunci] = useState(0);
  const [tabModal, setTabModal] = useState<"satuan" | "banyak">("satuan");
  const [sfxAktif, setSfxAktif] = useState(true);

  const NAV = [
    { href: "/today", label: t.navHome, ikon: "home" },
    { href: "/progress", label: t.navProgress, ikon: "progress" },
    { href: "/kalender", label: t.navCalendar, ikon: "kalender" },
    { href: "/profil", label: t.navProfile, ikon: "profil" },
  ];

  const JUDUL: Record<string, string> = {
    "/today": "Dashboard",
    "/progress": t.navProgress,
    "/kalender": t.navCalendar,
    "/profil": t.navProfile,
  };

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

  const gantiBahasa = () => {
    sfxClick();
    const target: Lang = lang === "id" ? "en" : "id";
    mulai(async () => {
      await setBahasa(target);
    });
  };

  // Fungsi khusus untuk buka modal logout
  const bukaLogout = () => {
    sfxClick();
    // Tutup modal akun dulu jika sedang terbuka
    dlgAkun.current?.close();
    dlgLogout.current?.showModal();
  };

  const inisial = nama.slice(0, 1).toUpperCase();
  const pakaiAkunPribadi = email !== "demo@deadlinemate.app";

  return (
    <>
      <a
        href="#isi"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-lime focus:px-4 focus:py-3 focus:font-bold focus:text-[#111]"
      >
        Skip to content
      </a>

      {/* ==================== SIDEBAR DESKTOP ==================== */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col justify-between border-r-2 border-[color:var(--line)] bg-card p-4 pb-16 lg:flex">
        <div className="flex flex-col gap-6">
          <Link href="/today" className="flex items-center gap-2.5 px-1 py-2">
            <span className="grid size-10 place-items-center rounded-xl border-2 border-[#141513] bg-lime text-lg font-extrabold text-[#111310] shadow-[0_3px_0_var(--sh)]">
              D
            </span>
            <div className="leading-tight">
              <span className="block text-lg font-extrabold tracking-tight text-ink">
                DeadlineMate
              </span>
            </div>
          </Link>

          <nav aria-label="Utama" className="flex flex-col gap-2">
            {NAV.map((n) => {
              const aktif = path === n.href;
              const navCls = aktif
                ? "flex min-h-12 items-center gap-3 rounded-xl border-2 border-[#141513] bg-lime px-3.5 font-extrabold text-[#111310] shadow-[0_3px_0_var(--sh)] transition-all"
                : "flex min-h-12 items-center gap-3 rounded-xl border-2 border-transparent px-3.5 font-bold text-ink/80 transition-all hover:border-[color:var(--line)] hover:bg-bg hover:text-ink";
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

          {/* FIX: Tombol Tambah Tugas yang lebar dan rapi */}
          <button type="button" onClick={bukaTugas} className="tombol w-full">
            <I n="plus" /> {t.newTask}
          </button>
        </div>

        {/* FIX: Tombol Logout dengan Modal Konfirmasi */}
        <button
          type="button"
          onClick={bukaLogout}
          className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-bold text-muted transition hover:bg-[color:var(--surface-2)] hover:text-ink"
        >
          <I n="logout" className="size-5" />
          <span>Logout</span>
        </button>
      </aside>

      <div className="lg:pl-56">
        {/* ==================== HEADER DESKTOP ==================== */}
        <header className="sticky top-0 z-20 hidden h-20 items-center justify-between border-b-2 border-[color:var(--line)] bg-card/95 px-8 backdrop-blur-sm lg:flex">
          <h2 className="text-2xl font-extrabold text-ink">
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
              🔥 Streak {streak}
            </span>

            <button
              type="button"
              onClick={gantiBahasa}
              title="Switch Language (ID / EN)"
              className="inline-flex min-h-10 items-center gap-1 rounded-xl border-2 border-[color:var(--line)] bg-card px-3 text-xs font-extrabold text-ink transition hover:-translate-y-0.5"
            >
              <span className={lang === "id" ? "text-lime" : "text-muted"}>
                ID
              </span>
              <span className="text-muted">/</span>
              <span className={lang === "en" ? "text-lime" : "text-muted"}>
                EN
              </span>
            </button>

            <DeadlineNotifier items={notifikasi} lang={lang} />

            <button
              type="button"
              onClick={ubahSuara}
              aria-label="Sound FX"
              className="grid size-10 place-items-center rounded-xl border-2 border-[color:var(--line)] bg-card text-ink transition hover:-translate-y-0.5"
            >
              <I n={sfxAktif ? "suaraOn" : "suaraOff"} />
            </button>

            <button
              type="button"
              onClick={gantiTema}
              aria-label="Ganti tema"
              className="grid size-10 place-items-center rounded-xl border-2 border-[color:var(--line)] bg-card text-ink transition hover:-translate-y-0.5"
            >
              <I n="bulan" />
            </button>

            <button
              type="button"
              onClick={() => {
                sfxClick();
                dlgAkun.current?.showModal();
              }}
              className="ml-1 flex items-center gap-2.5 rounded-xl border-2 border-transparent px-2 py-1 text-right transition hover:border-[color:var(--line)] hover:bg-bg"
            >
              <div className="leading-tight">
                <p className="font-extrabold text-ink">
                  {t.hi}, {nama}!
                </p>
                <p className="text-xs font-semibold text-muted">
                  Level {level} · {exp} EXP
                </p>
              </div>
              <span className="grid size-11 place-items-center rounded-full border-2 border-[#141513] bg-lime font-extrabold text-[#111310] shadow-[0_2px_0_var(--sh)]">
                {inisial}
              </span>
            </button>
          </div>
        </header>

        {/* ==================== HEADER MOBILE ==================== */}
        <header className="sticky top-0 z-20 border-b-2 border-[color:var(--line)] bg-card/95 px-4 pb-2.5 pt-[calc(env(safe-area-inset-top)+0.6rem)] backdrop-blur-sm lg:hidden">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                sfxClick();
                dlgAkun.current?.showModal();
              }}
              className="flex min-h-0 items-center gap-2.5 text-left"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-[#141513] bg-lime font-extrabold text-[#111310] shadow-[0_2px_0_var(--sh)]">
                {inisial}
              </span>
              <div className="leading-tight">
                <h2 className="text-base font-extrabold text-ink">
                  {t.hi}, {nama}!
                </h2>
                <p className="text-xs font-bold text-muted">
                  Level {level} · 🔥 {streak}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <DeadlineNotifier items={notifikasi} lang={lang} />
              <button
                type="button"
                onClick={gantiTema}
                aria-label="Ganti tema"
                className="grid size-10 min-h-0 min-w-0 place-items-center rounded-xl border-2 border-[color:var(--line)] bg-card text-ink"
              >
                <I n="bulan" className="size-4" />
              </button>
            </div>
          </div>
        </header>

        <main
          id="isi"
          className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8"
        >
          {children}
        </main>
      </div>

      {/* ==================== BOTTOM NAV MOBILE ==================== */}
      <nav
        aria-label="Utama"
        className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-[color:var(--line)] bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="grid grid-cols-5 items-end px-2 pb-2 pt-1">
          {[NAV[0], NAV[1], null, NAV[2], NAV[3]].map((n, i) => {
            if (!n) {
              return (
                <li key={`fab-${i}`} className="flex justify-center">
                  {/* FIX: Ukuran tombol FAB disesuaikan (size-14) biar gak nabrak */}
                  <button
                    type="button"
                    onClick={bukaTugas}
                    aria-label={t.newTask}
                    className="-mt-5 grid size-14 place-items-center rounded-full border-2 border-[#141513] bg-lime text-[#111310] shadow-[0_4px_0_var(--sh)] active:translate-y-1 active:shadow-none"
                  >
                    <I n="plus" className="size-7" />
                  </button>
                </li>
              );
            }
            const aktifMobile = path === n.href;
            const mobileCls = aktifMobile
              ? "mx-auto flex min-h-13 w-full max-w-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-[#141513] bg-lime text-xs font-extrabold text-[#111310]"
              : "mx-auto flex min-h-13 w-full max-w-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-bold text-muted";
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

      {/* ==================== DIALOG: KONFIRMASI LOGOUT ==================== */}
      <dialog
        ref={dlgLogout}
        onClick={(e) => {
          if (e.target === dlgLogout.current) dlgLogout.current?.close();
        }}
        className="m-auto w-[min(92vw,24rem)] rounded-2xl border-2 border-[color:var(--line)] bg-[color:var(--surface-raised)] p-5 text-ink shadow-[0_6px_0_var(--sh)] backdrop:bg-black/60"
      >
        <div className="flex items-center gap-3">
          <span
            className="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-[color:var(--line)]"
            style={{ background: "var(--bahaya-bg)", color: "var(--bahaya)" }}
          >
            <I n="logout" />
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
          <form action={keluarAkun} className="w-full">
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

      {/* ==================== DIALOG: AKUN PENGGUNA ==================== */}
      <dialog
        ref={dlgAkun}
        onClick={(e) => {
          if (e.target === dlgAkun.current) dlgAkun.current?.close();
        }}
        className="m-auto w-[min(92vw,25rem)] rounded-2xl border-2 border-[color:var(--line)] bg-[color:var(--surface-raised)] p-5 text-ink shadow-[0_6px_0_var(--sh)] backdrop:bg-black/60"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-ink">Akun Pengguna</h2>
            <p className="mt-0.5 text-xs text-muted">
              Aktif sebagai: <strong>{email}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={() => dlgAkun.current?.close()}
            aria-label="Tutup"
            className="grid size-10 place-items-center rounded-xl border-2 border-[color:var(--line)]"
          >
            <I n="x" />
          </button>
        </div>

        <form
          action={async (fd) => {
            await masukAkun(fd);
            dlgAkun.current?.close();
          }}
          className="mt-4 space-y-3"
        >
          <div>
            <label className="mb-1 block text-xs font-bold text-muted">
              Nama Panggilan
            </label>
            <input
              name="nama"
              type="text"
              required
              defaultValue={nama}
              className="kolom"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-muted">
              Email Akun
            </label>
            <input
              name="email"
              type="email"
              required
              defaultValue={email}
              className="kolom"
            />
          </div>
          <button type="submit" className="tombol w-full">
            Simpan Akun
          </button>
        </form>

        {/* FIX: Tombol ini sekarang memanggil modal logout, bukan langsung mengeksekusi form */}
        <button
          type="button"
          onClick={bukaLogout}
          className="tombol tombol-putih tombol-kecil w-full mt-2.5 text-[color:var(--bahaya)]"
        >
          Logout dari Akun Ini
        </button>
      </dialog>

      {/* ==================== DIALOG: TUGAS BARU ==================== */}
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
            <h2 className="text-2xl font-extrabold text-ink">
              <span className="judul-stabilo">{t.newTask}</span>
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

          <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-xl border-2 border-[color:var(--line)] bg-bg p-1">
            <button
              type="button"
              onClick={() => {
                sfxClick();
                setTabModal("satuan");
              }}
              className={`min-h-10 rounded-lg text-xs font-extrabold transition ${
                tabModal === "satuan"
                  ? "border-2 border-[#141513] bg-lime text-[#111310] shadow-[0_2px_0_var(--sh)]"
                  : "text-muted hover:text-ink"
              }`}
            >
              {t.singleTaskTab}
            </button>
            <button
              type="button"
              onClick={() => {
                sfxClick();
                setTabModal("banyak");
              }}
              className={`min-h-10 rounded-lg text-xs font-extrabold transition ${
                tabModal === "banyak"
                  ? "border-2 border-[#141513] bg-lime text-[#111310] shadow-[0_2px_0_var(--sh)]"
                  : "text-muted hover:text-ink"
              }`}
            >
              {t.multiTaskTab}
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
                  <h3 className="font-extrabold text-ink">
                    {lang === "en"
                      ? "Batch Task Studio (AI)"
                      : "Susun Banyak Tugas Sekaligus"}
                  </h3>
                  <span className="rounded-full border border-[color:var(--line)] bg-card px-2 py-0.5 text-[11px] font-extrabold text-ink">
                    Mate AI
                  </span>
                </div>
                <p className="mb-3 text-xs opacity-85">
                  {lang === "en"
                    ? "Enter multiple assignments below. Mate will create all tasks and break them into sub-steps in one click."
                    : "Masukkan daftar tugasmu di bawah. Mate akan membuat semua tugas sekaligus memecah langkah cicilannya dalam sekali klik."}
                </p>
                <RencanaForm />
              </section>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
