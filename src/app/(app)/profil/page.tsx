import { ambilRingkasan } from "@/lib/stats";
import { getBahasa, getCurrentUser } from "@/lib/session";
import { setBahasa } from "@/server/actions"; 
import { ubahProfilPreferensi } from "@/server/tugas-form";
import { DICT } from "@/lib/i18n";
import ThemeSwitch from "@/components/shell/ThemeSwitch";
import NotifToggle from "@/components/shell/NotifToggle";
import { Icon } from "@/components/ui/Icon";
import { redirect } from "next/navigation";
import ZonaBahaya from "@/components/shell/ZonaBahaya";

export default async function ProfilPage() {
  const [user, lang] = await Promise.all([getCurrentUser(), getBahasa()]);

  if (!user) {
    redirect("/login");
  }

  const t = DICT[lang];
  const r = await ambilRingkasan(user.id);
  const nama = user.name ?? "Wannn";

  const inisial = nama.slice(0, 1).toUpperCase();
  const pakaiAkunPribadi = user.email !== "demo@deadlinemate.app";

  // SISTEM QUEST: LENCANA BERTINGKAT (LOGIKA DIPERBAIKI)
  const lencana = [
    // 1. Quest Penyelesaian Tugas (Target Maksimal: 100 Tugas)
    r.totalSelesai < 1
      ? {
          ikon: "target" as const,
          judul: "Langkah Pertama",
          ket: "Selesaikan 1 tugas pertamamu.",
          progres: `${r.totalSelesai}/1`,
          angkaProgres: r.totalSelesai,
          target: 1,
          terbuka: false,
        }
      : r.totalSelesai < 10
        ? {
            ikon: "target" as const,
            judul: "Produktif Muda",
            ket: "Selesaikan 10 tugas.",
            progres: `${r.totalSelesai}/10`,
            angkaProgres: r.totalSelesai,
            target: 10,
            terbuka: false,
          }
        : r.totalSelesai < 50
          ? {
              ikon: "target" as const,
              judul: "Mesin Produktif",
              ket: "Selesaikan 50 tugas.",
              progres: `${r.totalSelesai}/50`,
              angkaProgres: r.totalSelesai,
              target: 50,
              terbuka: false,
            }
          : r.totalSelesai < 100
            ? {
                ikon: "target" as const,
                judul: "Si paling Rajin",
                ket: "Selesaikan 100 tugas.",
                progres: `${r.totalSelesai}/100`,
                angkaProgres: r.totalSelesai,
                target: 100,
                terbuka: false,
              }
            : {
                ikon: "target" as const,
                judul: "Legenda Tugas",
                ket: "Selesaikan 100 tugas.",
                progres: `${r.totalSelesai}/100`,
                angkaProgres: r.totalSelesai,
                target: 100,
                terbuka: true,
              },

    // 2. Quest Streak (Target Maksimal: 30 Hari)
    r.rekor < 3
      ? {
          ikon: "flame" as const,
          judul: "Pejuang Konsisten",
          ket: "Capai streak 3 hari.",
          progres: `${r.rekor}/3`,
          angkaProgres: r.rekor,
          target: 3,
          terbuka: false,
        }
      : r.rekor < 7
        ? {
            ikon: "flame" as const,
            judul: "Konsisten Terus",
            ket: "Capai streak 7 hari.",
            progres: `${r.rekor}/7`,
            angkaProgres: r.rekor,
            target: 7,
            terbuka: false,
          }
        : r.rekor < 30
          ? {
              ikon: "flame" as const,
              judul: "Tak Terbendung",
              ket: "Capai streak 30 hari.",
              progres: `${r.rekor}/30`,
              angkaProgres: r.rekor,
              target: 30,
              terbuka: false,
            }
          : {
              ikon: "flame" as const,
              judul: "Legenda Konsisten",
              ket: "Capai streak 30 hari.",
              progres: `${r.rekor}/30`,
              angkaProgres: r.rekor,
              target: 30,
              terbuka: true,
            },

    // 3. Quest Level / EXP (Target Maksimal: 2000 XP)
    r.exp < 100
      ? {
          ikon: "zap" as const,
          judul: "Anti-SKS Club",
          ket: "Kumpulkan 100 XP.",
          progres: `${r.exp}/100`,
          angkaProgres: r.exp,
          target: 100,
          terbuka: false,
        }
      : r.exp < 500
        ? {
            ikon: "zap" as const,
            judul: "Mahasiswa Elite",
            ket: "Kumpulkan 500 XP.",
            progres: `${r.exp}/500`,
            angkaProgres: r.exp,
            target: 500,
            terbuka: false,
          }
        : r.exp < 2000
          ? {
              ikon: "zap" as const,
              judul: "Dewa Deadline",
              ket: "Kumpulkan 2000 XP.",
              progres: `${r.exp}/2000`,
              angkaProgres: r.exp,
              target: 2000,
              terbuka: false,
            }
          : {
              ikon: "zap" as const,
              judul: "Mythic Scholar",
              ket: "Kumpulkan 2000 XP.",
              progres: `${r.exp}/2000`,
              angkaProgres: r.exp,
              target: 2000,
              terbuka: true,
            },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
          <span className="judul-stabilo">{t.profileTitle}</span>
        </h1>
        <p className="mt-1 text-sm text-muted">{t.profileSub}</p>
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
              {t.levelLabel} {r.level}
            </span>
          </div>
          <p className="text-sm font-bold text-muted mt-1">{user.email}</p>

          <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] px-3 py-1 text-xs font-extrabold text-ink">
              <Icon name="flame" className="size-3.5 text-oranye" /> {r.streak}{" "}
              {t.streak}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] px-3 py-1 text-xs font-extrabold text-ink">
              <Icon name="bolt" className="size-3.5 text-biru" /> {r.exp} XP
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] px-3 py-1 text-xs font-extrabold text-ink">
              <Icon name="check" className="size-3.5" /> {r.totalSelesai}{" "}
              {t.taskCount}
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
                {pakaiAkunPribadi ? t.synced : t.localSession}
              </span>
            </div>

            <form action={ubahProfilPreferensi} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-muted">
                  {t.permanentEmail}
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
                {t.saveProfile}
              </button>
            </form>
          </section>

          {/* Statistik Produktivitas */}
          <section className="kartu p-5 bg-card border-2 border-[color:var(--line)] shadow-[0_4px_0_var(--sh)]">
            <h2 className="text-sm font-black text-ink uppercase tracking-wider mb-4">
              {t.productivityStats}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] p-3 text-center">
                <p className="text-[10px] font-black text-muted uppercase">
                  {t.streakRecordTasks}
                </p>
                <p className="text-2xl font-black text-ink">
                  {r.rekor}{" "}
                  <span className="text-xs text-muted">{t.taskCount}</span>
                </p>
              </div>
              <div className="rounded-xl border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] p-3 text-center">
                <p className="text-[10px] font-black text-muted uppercase">
                  {t.totalTasks}
                </p>
                <p className="text-2xl font-black text-ink">
                  {r.totalSelesai}{" "}
                  <span className="text-xs text-muted">{t.taskCount}</span>
                </p>
              </div>
              <div className="col-span-2 rounded-xl border-2 border-[color:var(--line)] bg-lime p-3 flex items-center justify-between shadow-[0_2px_0_var(--sh)]">
                <div>
                  <p className="text-[10px] font-black text-[#111] uppercase">
                    {t.totalExpEarned}
                  </p>
                  <p className="text-2xl font-black text-[#111]">{r.exp} XP</p>
                </div>
                <Icon name="bolt" className="size-8 text-[#111]" />
              </div>
            </div>
          </section>

          {/* ZONA BERBAHAYA */}
          <ZonaBahaya lang={lang} />
        </div>

        {/* ================= KOLOM KANAN ================= */}
        <div className="space-y-6">
          {/* Preferensi */}
          <section className="kartu p-5 bg-card border-2 border-[color:var(--line)] shadow-[0_4px_0_var(--sh)] space-y-5">
            <div>
              <h2 className="text-sm font-black text-ink mb-2.5 uppercase tracking-wider">
                {t.languageLabel}
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
                    {t.langIndonesian}
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
                    {t.langEnglish}
                  </button>
                </form>
              </div>
            </div>

            <div className="border-t-2 border-[color:var(--line)]/10 pt-4">
              <h2 className="text-sm font-black text-ink mb-2.5 uppercase tracking-wider">
                {t.themeTitle}
              </h2>
              <ThemeSwitch lang={lang} />
            </div>
          </section>

          {/* ================= NOTIFIKASI PUSH (BARU) ================= */}
          <NotifToggle lang={lang} />

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
                  {t.unlocked}
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
                        className={`grid size-12 shrink-0 place-items-center rounded-lg border-2 shadow-[0_2px_0_var(--sh)] transition-transform hover:rotate-6 ${b.terbuka ? "border-[#111] bg-card text-ink" : "border-[color:var(--line)]/20 bg-transparent text-muted opacity-50 grayscale"}`}
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
                              {t.unlocked.toUpperCase()}
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
