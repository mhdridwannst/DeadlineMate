import { masukAkun } from "@/server/demo-user";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-[color:var(--bg)] px-4 py-10 relative overflow-hidden">
      {/* Background Pattern (Opsional, bikin rame dikit) */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#111 2px, transparent 2px)",
          backgroundSize: "24px 24px",
        }}
      ></div>

      <div className="kartu w-full max-w-md p-6 sm:p-8 relative z-10">
        {/* Logo & Maskot */}
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <span className="grid size-16 place-items-center rounded-2xl border-2 border-ink bg-lime text-3xl font-extrabold text-[#111] shadow-[0_4px_0_var(--sh)] animate-bounce">
            D
          </span>
          <h1 className="text-3xl font-black tracking-tight text-ink mt-2">
            DeadlineMate
          </h1>
          <p className="text-sm font-bold text-muted px-4">
            Level up your productivity. Atur jadwal bareng Mate.
          </p>
        </div>

        <div className="mb-5 border-t-2 border-[color:var(--line)]/20 pt-5">
          <h2 className="text-lg font-black text-ink">
            <span className="judul-stabilo">Mulai Petualanganmu</span>
          </h2> 
          <p className="mt-1 text-xs font-semibold text-muted leading-relaxed">
            Masukkan akun biar Mate bisa nyusun jadwal, jagain streak, dan
            naikin EXP lo.
          </p>
        </div>

        <form action={masukAkun} className="space-y-4">
          <div>
            <label
              htmlFor="login-nama"
              className="mb-1.5 block text-xs font-extrabold text-ink uppercase tracking-wider"
            >
              Nama Panggilan
            </label>
            <input
              id="login-nama"
              name="nama"
              type="text"
              required
              placeholder="Mis. Ryujin / Go Yoon Jung"
              className="kolom font-bold"
            />
          </div>

          <div>
            <label
              htmlFor="login-email"
              className="mb-1.5 block text-xs font-extrabold text-ink uppercase tracking-wider"
            >
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              required
              placeholder="nama@mahasiswa.ac.id"
              className="kolom font-bold"
            />
          </div>

          <button
            type="submit"
            className="tombol w-full text-base mt-2 shadow-[0_4px_0_var(--sh)] active:translate-y-1 active:shadow-none transition-all"
          >
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
}
