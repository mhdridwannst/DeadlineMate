import { masukAkun } from "@/server/demo-user";

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-[color:var(--bg)] px-4 py-10 relative overflow-hidden">
      {/* Background Pattern Dot-Dot (Lebih tebal dikit biar kerasa teksturnya) */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#111 2px, transparent 2px)",
          backgroundSize: "20px 20px",
        }}
      ></div>

      {/* Decorative Elements (Bintang-bintang ala Game) */}
      <div className="absolute top-10 left-10 text-4xl opacity-20 animate-pulse">
        ✦
      </div>
      <div className="absolute bottom-20 right-10 text-5xl opacity-20 animate-bounce">
        ✦
      </div>

      <div className="kartu w-full max-w-[26rem] p-6 sm:p-8 relative z-10 bg-card shadow-[0_8px_0_var(--sh)] border-2 border-[color:var(--line)]">
        {/* Logo & Brand */}
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <div className="relative">
            <span className="grid size-20 place-items-center rounded-2xl border-2 border-[#111] bg-lime text-4xl font-black text-[#111] shadow-[0_4px_0_var(--sh)] -rotate-3 transition-transform hover:rotate-0">
              D
            </span>
            {/* Badge kecil di logo */}
            <span className="absolute -bottom-2 -right-2 grid place-items-center rounded-lg border-2 border-[#111] bg-white px-2 py-0.5 text-[10px] font-black shadow-[0_2px_0_var(--sh)]">
              BETA
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-ink mt-4">
            DeadlineMate
          </h1>
          <p className="text-[13px] font-bold text-muted px-4">
            Ngejar deadline bareng AI, dijamin gak panik.
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-black text-ink">
            <span className="judul-stabilo">Mulai Petualanganmu</span>
          </h2>
          <p className="mt-1 text-xs font-semibold text-muted leading-relaxed">
            Masuk buat nyimpen progres, streak, dan XP lo selamanya.
          </p>
        </div>

        {/* Form Login */}
        <form action={masukAkun} className="space-y-4">
          {/* Input Nama */}
          <div className="group">
            <label
              htmlFor="login-nama"
              className="mb-1.5 block text-[10px] font-black text-ink uppercase tracking-wider"
            >
              Nama Panggilan
            </label>
            <div className="relative">
              {/* Ikon digeser ke kiri-4 */}
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-ink transition-colors">
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                id="login-nama"
                name="nama"
                type="text"
                required
                placeholder="Mis. Go Yoon Jung"
                // GUNAKAN INLINE STYLE BIAR GAK BENTROK SAMA CSS BAWAAN
                style={{ paddingLeft: "3.5rem" }}
                className="kolom font-bold placeholder:text-muted/60 group-hover:-translate-y-0.5 group-focus-within:shadow-[0_4px_0_var(--sh)] transition-all"
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
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-ink transition-colors">
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
              <input
                id="login-email"
                name="email"
                type="email"
                required
                placeholder="nama@mahasiswa.ac.id"
                style={{ paddingLeft: "3.5rem" }} // INLINE STYLE LAGI
                className="kolom font-bold placeholder:text-muted/60 group-hover:-translate-y-0.5 group-focus-within:shadow-[0_4px_0_var(--sh)] transition-all"
              />
            </div>
          </div>

          {/* Tombol Action */}
          <button type="submit" className="relative w-full group mt-2">
            <div className="absolute inset-0 bg-[#111] rounded-xl translate-y-1.5 transition-transform group-hover:translate-y-2 group-active:translate-y-0" />
            <div className="relative flex items-center justify-center gap-2 w-full bg-lime text-[#111] border-2 border-[#111] rounded-xl py-3.5 text-sm font-black transition-transform group-hover:-translate-y-0.5 group-active:translate-y-1">
              Gas Masuk!
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </form>

        {/* Footer / Trust Badges */}
        <div className="mt-8 border-t-2 border-[color:var(--line)]/10 pt-4">
          <p className="text-center text-[9px] font-black uppercase tracking-widest text-muted mb-3">
            Fitur Andalan
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            <span className="rounded-md border border-[color:var(--line)]/20 bg-[color:var(--surface-2)] px-2 py-1 text-[10px] font-bold text-muted">
              ✦ AI Pecah Tugas
            </span>
            <span className="rounded-md border border-[color:var(--line)]/20 bg-[color:var(--surface-2)] px-2 py-1 text-[10px] font-bold text-muted">
              🔥 Gamifikasi Streak
            </span>
            <span className="rounded-md border border-[color:var(--line)]/20 bg-[color:var(--surface-2)] px-2 py-1 text-[10px] font-bold text-muted">
              📅 Kalender Pintar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
