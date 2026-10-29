import { masukAkun } from "@/server/demo-user";
import { Icon } from "@/components/ui/Icon";
import LoginThemeToggle from "@/components/shell/LoginThemeToggle";

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-[color:var(--bg)] px-4 py-10 relative overflow-hidden">
      {/* TOMBOL DARK MODE DI POJOK KANAN ATAS */}
      <LoginThemeToggle />

      {/* ================= BACKGROUND PATTERN & DECORATIONS ================= */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#111 2px, transparent 2px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Dekorasi Bintang di Kanan Bawah */}
      <div className="absolute bottom-32 right-10 text-5xl opacity-20 animate-[pulse_3s_infinite] pointer-events-none">
        <Icon name="target" className="size-12 text-ink" />
      </div>
      <div className="absolute top-20 right-20 text-3xl opacity-10 rotate-12 pointer-events-none">
        <Icon name="zap" className="size-8 text-ink" />
      </div>

      {/* ================= MAIN CARD ================= */}
      <div className="kartu w-full max-w-[26rem] p-6 sm:p-8 relative z-10 bg-card shadow-[0_8px_0_var(--sh)] border-2 border-[color:var(--line)]">
        {/* Logo Section */}
        <div className="flex flex-col items-center text-center gap-2 mb-8">
          <div className="relative">
            <span className="grid size-20 place-items-center rounded-2xl border-2 border-[#111] bg-lime text-4xl font-black text-[#111] shadow-[0_4px_0_var(--sh)] -rotate-3 transition-transform hover:rotate-0 cursor-default">
              D
            </span>
            <span className="absolute -bottom-2 -right-2 grid place-items-center rounded-lg border-2 border-[#111] bg-white px-2 py-0.5 text-[10px] font-black text-[#111] shadow-[0_2px_0_var(--sh)] rotate-6">
              BETA
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-ink mt-4">
            Deadline Mate
          </h1>
          <p className="text-[13px] font-bold text-muted px-4">
            Atur Tugasmu, Bantu Harimu Makin Produktif.
          </p>
        </div>

        {/* Value Prop */}
        <div className="mb-6">
          <h2 className="text-lg font-black text-ink">
            <span className="judul-stabilo">Get Started</span>
          </h2>
          <p className="mt-2 text-xs font-semibold text-muted leading-relaxed">
            Masuk buat nyimpen progres, streak, dan XP lo selamanya.
          </p>
        </div>

        {/* Form */}
        <form action={masukAkun} className="space-y-4">
          {/* Input Nama */}
          <div className="group">
            <label
              htmlFor="login-nama"
              className="mb-1.5 block text-[10px] font-black text-ink uppercase tracking-wider"
            >
              Nama
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-ink transition-colors z-10">
                <Icon name="user" className="size-4" />
              </span>
              <input
                id="login-nama"
                name="nama"
                type="text"
                required
                placeholder="Mis. Go Yoon Jung"
                style={{ paddingLeft: "2.75rem" }}
                className="kolom font-bold group-hover:-translate-y-0.5 group-focus-within:shadow-[0_4px_0_var(--sh)] transition-all placeholder:text-muted/60"
              />
            </div>
          </div>

          {/* Input Email */}
          <div className="group">
            <label
              htmlFor="login-email"
              className="mb-1.5 block text-[10px] font-black text-ink uppercase tracking-wider"
            >
              Email
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-ink transition-colors z-10">
                <Icon name="mail" className="size-4" />
              </span>
              <input
                id="login-email"
                name="email"
                type="email"
                required
                placeholder="nama@mahasiswa.ac.id"
                style={{ paddingLeft: "2.75rem" }}
                className="kolom font-bold group-hover:-translate-y-0.5 group-focus-within:shadow-[0_4px_0_var(--sh)] transition-all placeholder:text-muted/60"
              />
            </div>
          </div>

          {/* Tombol Action */}
          <button type="submit" className="relative w-full group mt-4">
            <div className="absolute inset-0 bg-[#111] rounded-xl translate-y-1.5 transition-transform group-hover:translate-y-2 group-active:translate-y-0" />
            <div className="relative flex items-center justify-center gap-2 w-full bg-lime text-[#111] border-2 border-[#111] rounded-xl py-3.5 text-sm font-black transition-transform group-hover:-translate-y-0.5 group-active:translate-y-1">
              Masuk
              <Icon name="arrow-right" className="size-4" strokeWidth={3} />
            </div>
          </button>
        </form>

        {/* Footer / Trust Badges (FIX: Kontras Dark Mode) */}
        <div className="mt-8 border-t-2 border-[color:var(--line)]/10 pt-5">
          <p className="text-center text-[9px] font-black uppercase tracking-widest text-muted mb-3">
            Fitur Andalan
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {/* Ubah text-[#111] jadi text-ink, dan text-muted jadi text-ink/80 */}
            <span className="inline-flex items-center gap-1.5 rounded-md border-2 border-[color:var(--line)]/50 bg-[color:var(--surface-2)] px-2.5 py-1 text-[10px] font-bold text-ink/80">
              <Icon name="sparkle" className="size-3 text-ink" /> AI Pecah Tugas
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border-2 border-[color:var(--line)]/50 bg-[color:var(--surface-2)] px-2.5 py-1 text-[10px] font-bold text-ink/80">
              <Icon name="flame" className="size-3 text-ink" /> Gamifikasi
              Streak
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border-2 border-[color:var(--line)]/50 bg-[color:var(--surface-2)] px-2.5 py-1 text-[10px] font-bold text-ink/80">
              <Icon name="calendar" className="size-3 text-ink" /> Kalender
              Pintar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
