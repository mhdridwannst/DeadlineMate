import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { auth } from "@/auth";

export default async function LandingPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-dvh bg-[color:var(--bg)] text-ink relative overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(var(--ink) 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* ================= NAVBAR ================= */}
      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl border-2 border-[#111] bg-lime text-lg font-extrabold text-[#111] shadow-[0_3px_0_var(--sh)]">
            D
          </span>
          <span className="text-xl font-black tracking-tight text-ink">
            DeadlineMate
          </span>
        </div>

        {/* CONDITIONAL BUTTON: Login vs Dashboard */}
        <Link
          href={isLoggedIn ? "/today" : "/login"}
          className="relative group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#111] bg-card px-4 py-2 text-sm font-black text-ink shadow-[0_3px_0_var(--sh)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
        >
          {isLoggedIn ? (
            <>
              <span>Ke Dashboard</span>
              <Icon name="arrow-right" className="size-4" strokeWidth={3} />
            </>
          ) : (
            "Masuk"
          )}
        </Link>
      </nav>

      {/* ================= HERO SECTION ================= */}
      <main className="relative z-10 mx-auto max-w-6xl px-5 pt-12 pb-24 lg:pt-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Kiri: Teks & CTA */}
          <section>
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#111] bg-lime px-3 py-1 text-xs font-black text-[#111] shadow-[0_2px_0_var(--sh)] mb-6 -rotate-2">
              <Icon name="sparkle" className="size-3.5" />
              <span>Baru rilis versi BETA</span>
            </div>

            <h1 className="max-w-lg text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Teman yang ngejar deadline bareng kamu.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
              Mate, asisten AI-mu, memecah tugas besar jadi langkah kecil dengan
              tenggatnya masing-masing, jadi kamu nggak numpuk di malam sebelum
              deadline.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href={isLoggedIn ? "/today" : "/login"}
                className="relative w-full sm:w-auto group inline-flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-[#111] rounded-xl translate-y-1.5 transition-transform group-hover:translate-y-2 group-active:translate-y-0" />
                <div className="relative flex items-center justify-center gap-2 w-full bg-lime text-[#111] border-2 border-[#111] rounded-xl px-8 py-3.5 text-sm font-black transition-transform group-hover:-translate-y-0.5 group-active:translate-y-1">
                  {isLoggedIn ? "Lanjut Produktif" : "Gas Mulai Sekarang"}
                  <Icon name="arrow-right" className="size-4" strokeWidth={3} />
                </div>
              </Link>
            </div>

            <p className="mt-4 text-xs font-semibold text-muted">
              {isLoggedIn
                ? "Semua tugasmu udah nunggu."
                : "Gratis. Tanpa kartu kredit."}
            </p>
          </section>

          {/* Kanan: Mockup Task Card */}
          <section className="relative">
            <div className="absolute -top-4 right-8 z-20 rounded-md border-2 border-[#111] bg-lime px-3 py-1 text-xs font-black text-[#111] shadow-[0_2px_0_var(--sh)] -rotate-2 transition-transform hover:rotate-0">
              <Icon name="flame" className="inline size-3 mr-1" /> Streak 3 hari
            </div>

            <div className="relative bg-card border-2 border-[color:var(--line)] rounded-xl p-5 shadow-[0_6px_0_var(--sh)] transform rotate-1 hover:rotate-0 transition-transform">
              <h3 className="text-lg font-black text-ink mb-1">
                Laporan praktikum sinyal
              </h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="rounded bg-[color:var(--bahaya-bg)] px-1.5 py-0.5 text-[10px] font-bold text-[color:var(--bahaya)]">
                  Tinggi
                </span>
                <span className="text-[10px] font-semibold text-muted">
                  Kumpul Jumat, 16.00 • Kuliah
                </span>
              </div>

              <div className="border-t-2 border-dashed border-[color:var(--line)]/20 pt-4">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="grid size-5 shrink-0 place-items-center rounded-md border-2 border-[#111] bg-lime mt-0.5">
                      <Icon
                        name="check"
                        className="size-3 text-[#111]"
                        strokeWidth={4}
                      />
                    </span>
                    <div>
                      <p className="text-sm font-bold line-through text-muted">
                        Kumpulkan data percobaan
                      </p>
                      <p className="text-xs font-semibold text-muted">
                        Rabu • 45 menit
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="grid size-5 shrink-0 place-items-center rounded-md border-2 border-[color:var(--line)] bg-transparent text-[10px] font-black text-ink mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="text-sm font-bold text-ink">
                        Tulis analisis dan pembahasan
                      </p>
                      <p className="text-xs font-semibold text-muted">
                        Kamis • 90 menit
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="grid size-5 shrink-0 place-items-center rounded-md border-2 border-[color:var(--line)] bg-transparent text-[10px] font-black text-ink mt-0.5">
                      3
                    </span>
                    <div>
                      <p className="text-sm font-bold text-ink">
                        Cek format lalu kumpul
                      </p>
                      <p className="text-xs font-semibold text-muted">
                        Jumat pagi • 30 menit
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* ================= FEATURES SECTION ================= */}
        <section className="mt-24 border-t-2 border-[color:var(--line)]/10 pt-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-black text-ink uppercase tracking-wider">
              Fitur Andalan
            </h2>
            <p className="mt-2 text-sm font-semibold text-muted">
              Dirancang buat mahasiswa yang sibuk.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="kartu p-6 bg-card border-2 border-[color:var(--line)] shadow-[0_4px_0_var(--sh)] text-center hover:-translate-y-1 transition-transform">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl border-2 border-[#111] bg-lime shadow-[0_2px_0_var(--sh)] mb-4">
                <Icon name="sparkle" className="size-6 text-[#111]" />
              </div>
              <h3 className="text-base font-black text-ink mb-2">
                AI Pecah Tugas
              </h3>
              <p className="text-xs font-semibold text-muted leading-relaxed">
                Bingung mulai dari mana? AI bakal mecah tugasmu jadi langkah
                kecil.
              </p>
            </div>

            <div className="kartu p-6 bg-card border-2 border-[color:var(--line)] shadow-[0_4px_0_var(--sh)] text-center hover:-translate-y-1 transition-transform">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl border-2 border-[#111] bg-lime shadow-[0_2px_0_var(--sh)] mb-4">
                <Icon name="flame" className="size-6 text-[#111]" />
              </div>
              <h3 className="text-base font-black text-ink mb-2">
                Gamifikasi Streak
              </h3>
              <p className="text-xs font-semibold text-muted leading-relaxed">
                Kumpulin EXP, naikin level, dan jaga streak biar makin semangat.
              </p>
            </div>

            <div className="kartu p-6 bg-card border-2 border-[color:var(--line)] shadow-[0_4px_0_var(--sh)] text-center hover:-translate-y-1 transition-transform">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl border-2 border-[#111] bg-lime shadow-[0_2px_0_var(--sh)] mb-4">
                <Icon name="calendar" className="size-6 text-[#111]" />
              </div>
              <h3 className="text-base font-black text-ink mb-2">
                Kalender Pintar
              </h3>
              <p className="text-xs font-semibold text-muted leading-relaxed">
                Semua deadline dalam satu tampilan. Gak ada lagi tanggal yang
                kelewat.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="relative z-10 border-t-2 border-[color:var(--line)]/10 py-8 text-center">
        <p className="text-xs font-bold text-muted">
          Dibuat dengan penuh perjuangan oleh <strong>Kelompok 2</strong>.
        </p>
        <p className="mt-1 text-[10px] font-semibold text-muted/60">
          Final Project UKM Software Development 2026
        </p>
      </footer>
    </div>
  );
}
