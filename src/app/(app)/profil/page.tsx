import { ambilRingkasan } from "@/lib/stats";
import {
  getBahasa,
  getDemoUser,
  keluarKeDemo,
  masukAkun,
  setBahasa,
} from "@/server/demo-user";
import { ubahProfilPreferensi } from "@/server/tugas-form";
import { DICT } from "@/lib/i18n";
import ThemeSwitch from "@/components/shell/ThemeSwitch";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const [user, lang] = await Promise.all([getDemoUser(), getBahasa()]);
  const t = DICT[lang];
  const r = await ambilRingkasan(user.id);
  const nama = user.name ?? "Wannn";
  const pakaiAkunPribadi = user.email !== "demo@deadlinemate.app";

  const NADA_MATE = [
    {
      id: "SUPPORTIVE",
      label: "Supportive Mentor",
      badge: lang === "en" ? "Warm" : "Hangat",
      ket:
        lang === "en"
          ? "Appreciates small wins and keeps your study rhythm calm."
          : "Mengapresiasi progres kecil dan menjaga ritme belajarmu tetap tenang.",
    },
    {
      id: "SANTAI",
      label: "Campus Bestie",
      badge: lang === "en" ? "Casual" : "Santai",
      ket:
        lang === "en"
          ? "Friendly peer vibe—relaxed but keeps you on track."
          : "Gaya teman satu tongkrongan, asik tapi tetap ngingetin deadline.",
    },
    {
      id: "TEGAS",
      label: "Strict Advisor",
      badge: lang === "en" ? "Direct" : "Tegas",
      ket:
        lang === "en"
          ? "Direct and firm when you procrastinate on high-priority tasks."
          : "To-the-point dan disiplin kalau kamu mulai menunda tugas.",
    },
  ] as const;

  const lencana = [
    {
      kode: "01",
      judul: lang === "en" ? "First Milestone" : "Langkah Pertama",
      ket:
        lang === "en"
          ? "Complete at least 1 task"
          : "Menyelesaikan minimal 1 tugas hingga tuntas",
      terbuka: r.totalSelesai >= 1,
    },
    {
      kode: "02",
      judul: lang === "en" ? "Streak Guardian" : "Pejuang Konsisten",
      ket:
        lang === "en"
          ? "Maintain a 3-day active streak"
          : "Menjaga rekor streak minimal 3 hari beruntun",
      terbuka: r.rekor >= 3,
    },
    {
      kode: "03",
      judul: "Anti-SKS Club",
      ket:
        lang === "en"
          ? "Reach Level 2 by earning 100+ EXP"
          : "Menembus Level 2 dengan mengumpulkan 100+ EXP",
      terbuka: r.exp >= 100,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
          {t.profileTitle}
        </h1>
        <p className="mt-1 text-sm text-muted">{t.profileSub}</p>
      </div>

      {/* Kartu Identitas User */}
      <section className="kartu-lime flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-lime text-2xl font-extrabold text-[#09090b] shadow-sm">
            {nama.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xl font-extrabold text-ink">{nama}</p>
              <span className="rounded-full border border-[color:var(--line)] bg-card px-2.5 py-0.5 text-xs font-extrabold text-lime">
                Level {r.level}
              </span>
            </div>
            <p className="mt-0.5 text-xs font-semibold text-muted">
              {user.email} · {r.exp} XP Total
            </p>
          </div>
        </div>

        <span className="rounded-xl border border-[color:var(--line)] bg-card px-3 py-1.5 text-xs font-extrabold text-ink">
          Persona: {user.coachTone}
        </span>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Kolom Kiri: Akun Permanen + Bahasa + Tema */}
        <div className="space-y-6">
          <section className="kartu p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-extrabold text-ink">
                {t.accountSection}
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                  pakaiAkunPribadi ? "bg-lime/20 text-lime" : "bg-bg text-muted"
                }`}
              >
                {pakaiAkunPribadi ? "Cloud Synced" : "Demo Session"}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">{t.accountDesc}</p>

            <form action={masukAkun} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-muted">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={pakaiAkunPribadi ? user.email : ""}
                  placeholder="nama@mahasiswa.ac.id"
                  className="kolom"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-muted">
                  {t.nickname}
                </label>
                <input
                  name="nama"
                  type="text"
                  defaultValue={nama}
                  placeholder="Wannn"
                  className="kolom"
                />
              </div>
              <button type="submit" className="tombol w-full text-sm">
                {t.switchAccount}
              </button>
            </form>

            {pakaiAkunPribadi && (
              <form action={keluarKeDemo} className="mt-2">
                <button
                  type="submit"
                  className="tombol tombol-putih tombol-kecil w-full"
                >
                  {t.logoutDemo}
                </button>
              </form>
            )}
          </section>

          {/* Pengaturan Bahasa (ID / EN) & Tema */}
          <section className="kartu p-5 space-y-5">
            <div>
              <h2 className="text-base font-extrabold text-ink">
                {t.languageLabel}
              </h2>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <form
                  action={async () => {
                    "use server";
                    await setBahasa("id");
                  }}
                >
                  <button
                    type="submit"
                    className={`w-full rounded-xl border p-2.5 text-xs font-extrabold transition ${
                      lang === "id"
                        ? "border-lime bg-lime text-[#09090b]"
                        : "border-[color:var(--line)] bg-bg text-ink hover:border-lime"
                    }`}
                  >
                    🇮🇩 Bahasa Indonesia
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
                    className={`w-full rounded-xl border p-2.5 text-xs font-extrabold transition ${
                      lang === "en"
                        ? "border-lime bg-lime text-[#09090b]"
                        : "border-[color:var(--line)] bg-bg text-ink hover:border-lime"
                    }`}
                  >
                    🇬🇧 English (Global)
                  </button>
                </form>
              </div>
            </div>

            <div className="border-t border-[color:var(--line)] pt-4">
              <h2 className="text-base font-extrabold text-ink">
                {t.themeTitle}
              </h2>
              <p className="mb-3 mt-0.5 text-xs text-muted">{t.themeSub}</p>
              <ThemeSwitch />
            </div>
          </section>
        </div>

        {/* Kolom Kanan: Karakter AI Coach + Lencana */}
        <div className="space-y-6">
          <section className="kartu p-5">
            <h2 className="text-base font-extrabold text-ink">
              {t.coachTitle}
            </h2>
            <p className="mt-1 text-xs text-muted">{t.coachSub}</p>

            <form action={ubahProfilPreferensi} className="mt-4 space-y-3">
              <input type="hidden" name="nama" value={nama} />
              <fieldset className="space-y-2">
                {NADA_MATE.map((item) => {
                  const aktif = user.coachTone === item.id;
                  return (
                    <label
                      key={item.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                        aktif
                          ? "border-lime bg-bg"
                          : "border-[color:var(--line)] bg-bg/40 hover:border-muted"
                      }`}
                    >
                      <input
                        type="radio"
                        name="coachTone"
                        value={item.id}
                        defaultChecked={aktif}
                        className="mt-1 size-4 accent-lime"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-ink">
                            {item.label}
                          </span>
                          <span className="rounded border border-[color:var(--line)] bg-card px-2 py-0.5 text-[10px] font-bold text-muted">
                            {item.badge}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted">{item.ket}</p>
                      </div>
                    </label>
                  );
                })}
              </fieldset>

              <button type="submit" className="tombol w-full text-sm">
                {t.savePrefs}
              </button>
            </form>
          </section>

          <section className="kartu p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-ink">
                {t.badgesTitle}
              </h2>
              <span className="text-xs font-bold text-muted">
                {lencana.filter((l) => l.terbuka).length}/{lencana.length}{" "}
                {t.unlocked}
              </span>
            </div>

            <ul className="mt-3 space-y-2.5">
              {lencana.map((b) => (
                <li
                  key={b.kode}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    b.terbuka
                      ? "border-lime/60 bg-bg text-ink"
                      : "border-[color:var(--line)] bg-bg/30 text-muted opacity-55"
                  }`}
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-lg font-mono text-xs font-extrabold ${
                      b.terbuka
                        ? "bg-lime text-[#09090b]"
                        : "border border-[color:var(--line)] bg-card text-muted"
                    }`}
                  >
                    {b.terbuka ? "✓" : b.kode}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-ink">{b.judul}</p>
                    <p className="text-[11px] text-muted">{b.ket}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
