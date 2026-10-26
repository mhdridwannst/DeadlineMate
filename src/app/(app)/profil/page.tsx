import { ambilRingkasan } from "@/lib/stats";
import {
  getBahasa,
  getDemoUser,
  keluarKeDemo,
  masukAkun,
  setBahasa,
} from "@/server/demo-user";
import { DICT } from "@/lib/i18n";
import ThemeSwitch from "@/components/shell/ThemeSwitch";

export default async function ProfilPage() {
  const [user, lang] = await Promise.all([getDemoUser(), getBahasa()]);
  const t = DICT[lang];
  const r = await ambilRingkasan(user.id);
  const nama = user.name ?? "Wannn";
  const pakaiAkunPribadi = user.email !== "demo@deadlinemate.app";

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
          <span className="judul-stabilo">{t.profileTitle}</span>
        </h1>
        <p className="mt-1 text-sm text-muted">
          {lang === "en"
            ? "Manage your cloud account, language, interface theme, and academic milestones."
            : "Kelola akun penyimpanan cloud, bahasa pengantar, tema tampilan, dan pencapaian akademikmu."}
        </p>
      </div>

      {/* Kartu Identitas User */}
      <section className="kartu-lime flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl border-2 border-[#141513] bg-lime text-2xl font-extrabold text-[#111310] shadow-[0_3px_0_var(--sh)]">
            {nama.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xl font-extrabold text-ink">{nama}</p>
              <span className="rounded-full border border-[color:var(--line)] bg-card px-2.5 py-0.5 text-xs font-extrabold text-ink">
                Level {r.level}
              </span>
            </div>
            <p className="mt-0.5 text-xs font-semibold text-muted">
              {user.email} · {r.exp} XP Total
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-xl border-2 border-[color:var(--line)] bg-card px-3 py-1.5 text-xs font-extrabold text-ink">
            🔥 Streak: {r.streak}d
          </span>
          <span className="rounded-xl border-2 border-[color:var(--line)] bg-card px-3 py-1.5 text-xs font-extrabold text-ink">
            ✓ {r.totalSelesai} {t.done}
          </span>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Kolom Kiri: Akun Permanen */}
        <section className="kartu p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-extrabold text-ink">
              {t.accountSection}
            </h2>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${
                pakaiAkunPribadi
                  ? "border-[#141513] bg-lime text-[#111310]"
                  : "border-[color:var(--line)] bg-bg text-muted"
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
            <form action={keluarKeDemo} className="mt-2.5">
              <button
                type="submit"
                className="tombol tombol-putih tombol-kecil w-full"
              >
                {t.logoutDemo}
              </button>
            </form>
          )}
        </section>

        {/* Kolom Kanan: Bahasa, Tema & Pencapaian */}
        <div className="space-y-6">
          <section className="kartu space-y-5 p-5">
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
                    className={`w-full rounded-xl border-2 p-2.5 text-xs font-extrabold transition ${
                      lang === "id"
                        ? "border-[#141513] bg-lime text-[#111310] shadow-[0_2px_0_var(--sh)]"
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
                    className={`w-full rounded-xl border-2 p-2.5 text-xs font-extrabold transition ${
                      lang === "en"
                        ? "border-[#141513] bg-lime text-[#111310] shadow-[0_2px_0_var(--sh)]"
                        : "border-[color:var(--line)] bg-bg text-ink hover:border-lime"
                    }`}
                  >
                    🇬🇧 English (Global)
                  </button>
                </form>
              </div>
            </div>

            <div className="border-t-2 border-[color:var(--line)]/15 pt-4">
              <h2 className="text-base font-extrabold text-ink">
                {t.themeTitle}
              </h2>
              <p className="mb-3 mt-0.5 text-xs text-muted">{t.themeSub}</p>
              <ThemeSwitch />
            </div>
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
                  className={`flex items-center gap-3 rounded-xl border-2 p-3 ${
                    b.terbuka
                      ? "border-[color:var(--line)] bg-lime-soft text-ink"
                      : "border-[color:var(--line)]/30 bg-bg/40 text-muted opacity-60"
                  }`}
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-lg border-2 font-mono text-xs font-extrabold ${
                      b.terbuka
                        ? "border-[#141513] bg-lime text-[#111310]"
                        : "border-[color:var(--line)] bg-card text-muted"
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
