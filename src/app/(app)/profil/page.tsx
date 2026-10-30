import { ambilRingkasan } from "@/lib/stats";
import { getBahasa, getDemoUser, setBahasa } from "@/server/demo-user";
import { ubahProfilPreferensi } from "@/server/tugas-form";
import { DICT } from "@/lib/i18n";
import ThemeSwitch from "@/components/shell/ThemeSwitch";
import { Icon } from "@/components/ui/Icon";
import { redirect } from "next/navigation";
import ZonaBahaya from "@/components/shell/ZonaBahaya";

export default async function ProfilPage() {
  const [user, lang] = await Promise.all([getDemoUser(), getBahasa()]);

  if (!user) {
    redirect("/login");
  }

  const t = DICT[lang];
  const r = await ambilRingkasan(user.id);
  const nama = user.name ?? "Wannn";

  const inisial = nama.slice(0, 1).toUpperCase();
  const pakaiAkunPribadi = user.email !== "demo@deadlinemate.app";

  const lencana = [
    {
      ikon: "target" as const,
      judul: lang === "en" ? "First Milestone" : "Langkah Pertama",
      ket:
        lang === "en"
          ? "Complete at least 1 task"
          : "Selesaikan minimal 1 tugas",
      progres: `${Math.min(1, r.totalSelesai)}/1`,
      angkaProgres: Math.min(1, r.totalSelesai),
      target: 1,
      terbuka: r.totalSelesai >= 1,
    },
    {
      ikon: "flame" as const,
      judul: lang === "en" ? "Streak Guardian" : "Pejuang Konsisten",
      ket:
        lang === "en"
          ? "Maintain a 3-day active streak"
          : "Jaga rekor streak 3 hari",
      progres: `${Math.min(3, r.rekor)}/3`,
      angkaProgres: Math.min(3, r.rekor),
      target: 3,
      terbuka: r.rekor >= 3,
    },
    {
      ikon: "zap" as const,
      judul: "Anti-SKS Club",
      ket:
        lang === "en" ? "Reach Level 2 (100+ EXP)" : "Tembus Level 2 (100+ XP)",
      progres: `${Math.min(100, r.exp)}/100`,
      angkaProgres: Math.min(100, r.exp),
      target: 100,
      terbuka: r.exp >= 100,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
          <span className="judul-stabilo">{t.profileTitle}</span>
        </h1>
        <p className="mt-1 text-sm text-muted">
          {lang === "en"
            ? "Manage your account, preferences, and view your productivity stats."
            : "Kelola akun, preferensi, dan lihat statistik produktivitasmu."}
        </p>
      </div>

      {/* ================= 1. PLAYER ID CARD ================= */}
      <section className="kartu bg-card border-2 border-[color:var(--line)] shadow-[0_4px_0_var(--sh)] p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5">
        <span className="grid size-20 shrink-0 place-items-center rounded-2xl border-2 border-[color:var(--line)] bg-lime text-3xl font-black text-[#111] shadow-[0_4px_0_var(--sh)]">
          {inisial}
        </span>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <h2 className="text-2xl font-black text-ink">{nama}</h2>
            <span className="rounded-md border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] px-2 py-0.5 text-xs font-black text-ink">
              LEVEL {r.level}
            </span>
          </div>
          <p className="text-sm font-bold text-muted mt-1">{user.email}</p>

          <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] px-3 py-1 text-xs font-extrabold text-ink">
              <Icon name="flame" className="size-3.5 text-oranye" /> {r.streak}{" "}
              Streak
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] px-3 py-1 text-xs font-extrabold text-ink">
              <Icon name="bolt" className="size-3.5 text-biru" /> {r.exp} XP
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] px-3 py-1 text-xs font-extrabold text-ink">
              <Icon name="check" className="size-3.5" /> {r.totalSelesai} Tugas
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {/* ================= KOLOM KIRI ================= */}
        <div className="space-y-6">
          {/* Form Profil */}
          <section className="kartu p-5 bg-card border-2 border-[color:var(--line)] shadow-[0_4px_0_var(--sh)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-ink uppercase tracking-wider">
                {t.accountSection}
              </h2>
              <span className="rounded-md border border-[color:var(--line)] bg-[color:var(--surface-2)] px-2 py-0.5 text-[10px] font-bold text-muted">
                {pakaiAkunPribadi ? "Tersinkron" : "Sesi Lokal"}
              </span>
            </div>

            <form action={ubahProfilPreferensi} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-muted">
                  Email (Permanen)
                </label>
                <input
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  className="kolom font-bold opacity-60 cursor-not-allowed"
                  disabled
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-muted">
                  {t.nickname}
                </label>
                <input
                  name="nama"
                  type="text"
                  defaultValue={nama}
                  className="kolom font-bold"
                  required
                />
              </div>
              <button
                type="submit"
                className="tombol w-full text-sm shadow-[0_3px_0_var(--sh)] active:translate-y-1 active:shadow-none"
              >
                Simpan Profil
              </button>
            </form>
          </section>

          {/* Statistik Produktivitas */}
          <section className="kartu p-5 bg-card border-2 border-[color:var(--line)] shadow-[0_4px_0_var(--sh)]">
            <h2 className="text-sm font-black text-ink uppercase tracking-wider mb-4">
              Statistik Produktivitas
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] p-3 text-center">
                <p className="text-[10px] font-black text-muted uppercase">
                  Rekor Streak
                </p>
                <p className="text-2xl font-black text-ink">
                  {r.rekor} <span className="text-xs text-muted">hari</span>
                </p>
              </div>
              <div className="rounded-xl border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] p-3 text-center">
                <p className="text-[10px] font-black text-muted uppercase">
                  Total Selesai
                </p>
                <p className="text-2xl font-black text-ink">
                  {r.totalSelesai}{" "}
                  <span className="text-xs text-muted">tugas</span>
                </p>
              </div>
              <div className="col-span-2 rounded-xl border-2 border-[color:var(--line)] bg-lime p-3 flex items-center justify-between shadow-[0_2px_0_var(--sh)]">
                <div>
                  <p className="text-[10px] font-black text-[#111] uppercase">
                    Total EXP Terkumpul
                  </p>
                  <p className="text-2xl font-black text-[#111]">{r.exp} XP</p>
                </div>
                <Icon name="bolt" className="size-8 text-[#111]" />
              </div>
            </div>
          </section>

          {/* ZONA BERBAHAYA (COMPONENT BARU) */}
          <ZonaBahaya />
        </div>

        {/* ================= KOLOM KANAN ================= */}
        <div className="space-y-6">
          {/* Preferensi */}
          <section className="kartu p-5 bg-card border-2 border-[color:var(--line)] shadow-[0_4px_0_var(--sh)] space-y-5">
            <div>
              <h2 className="text-sm font-black text-ink mb-2.5 uppercase tracking-wider">
                Bahasa
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <form
                  action={async () => {
                    "use server";
                    await setBahasa("id");
                  }}
                >
                  <button
                    type="submit"
                    className={`w-full rounded-xl border-2 p-2.5 text-xs font-extrabold transition-all ${lang === "id" ? "border-[#111] bg-lime text-[#111] shadow-[0_2px_0_var(--sh)]" : "border-[color:var(--line)] bg-[color:var(--surface-2)] text-muted hover:border-lime"}`}
                  >
                    Bahasa Indonesia
                  </button>
                </form>
                <form
                  action={async () => {
                    "use server";
                    await setBahasa("en");
                  }}
                >
                  <button
                    type="submit"
                    className={`w-full rounded-xl border-2 p-2.5 text-xs font-extrabold transition-all ${lang === "en" ? "border-[#111] bg-lime text-[#111] shadow-[0_2px_0_var(--sh)]" : "border-[color:var(--line)] bg-[color:var(--surface-2)] text-muted hover:border-lime"}`}
                  >
                    English
                  </button>
                </form>
              </div>
            </div>

            <div className="border-t-2 border-[color:var(--line)]/10 pt-4">
              <h2 className="text-sm font-black text-ink mb-2.5 uppercase tracking-wider">
                {t.themeTitle}
              </h2>
              <ThemeSwitch />
            </div>
          </section>

          {/* Lencana (Trophy Room) */}
          <section className="kartu p-5 bg-card border-2 border-[color:var(--line)] shadow-[0_4px_0_var(--sh)] relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#111 2px, transparent 2px)",
                backgroundSize: "16px 16px",
              }}
            ></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black text-ink uppercase tracking-wider">
                  {t.badgesTitle}
                </h2>
                <span className="text-[10px] font-bold text-muted bg-[color:var(--surface-2)] px-2 py-0.5 rounded-md border border-[color:var(--line)]/20">
                  {lencana.filter((l) => l.terbuka).length}/{lencana.length}{" "}
                  Terbuka
                </span>
              </div>
              <ul className="space-y-3">
                {lencana.map((b) => (
                  <li
                    key={b.judul}
                    className={`flex flex-col gap-2 rounded-xl border-2 p-3 transition-all relative ${b.terbuka ? "border-[#111] bg-lime shadow-[0_3px_0_var(--sh)] hover:-translate-y-0.5" : "border-[color:var(--line)]/30 bg-[color:var(--surface-2)] opacity-80"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid size-12 shrink-0 place-items-center rounded-lg border-2 shadow-[0_2px_0_var(--sh)] transition-transform hover:rotate-6 ${b.terbuka ? "border-[#111] bg-card text-[#111]" : "border-[color:var(--line)]/20 bg-transparent text-muted opacity-50 grayscale"}`}
                      >
                        <Icon
                          name={b.ikon}
                          className="size-6"
                          strokeWidth={2.5}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-sm font-black ${b.terbuka ? "text-[#111]" : "text-muted"}`}
                          >
                            {b.judul}
                          </p>
                          {b.terbuka && (
                            <span className="rounded border border-[#111] bg-card px-1.5 py-0.5 text-[9px] font-black shadow-[1px_1px_0_var(--sh)] rotate-3 flex items-center gap-1">
                              <Icon name="trophy" className="size-2.5" />{" "}
                              TERBUKA
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[11px] font-semibold leading-tight mt-0.5 ${b.terbuka ? "text-[#111]/70" : "text-muted"}`}
                        >
                          {b.ket}
                        </p>
                      </div>
                    </div>
                    {!b.terbuka && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-2 flex-1 rounded-full border-2 border-[color:var(--line)]/30 bg-[color:var(--surface)] overflow-hidden">
                          <div
                            className="h-full bg-lime transition-all duration-500 border-r-2 border-[color:var(--line)]"
                            style={{
                              width: `${(b.angkaProgres / b.target) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-[9px] font-black text-muted min-w-[30px] text-right flex items-center gap-1">
                          <Icon name="lock" className="size-2.5" /> {b.progres}
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
