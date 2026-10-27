import { ambilRingkasan } from "@/lib/stats";
import {
  getBahasa,
  getDemoUser,
  masukAkun,
  setBahasa,
} from "@/server/demo-user";
import { ubahProfilPreferensi } from "@/server/tugas-form";
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
      ikon: "🎯",
      judul: lang === "en" ? "First Milestone" : "Langkah Pertama",
      ket:
        lang === "en"
          ? "Complete at least 1 task"
          : "Selesaikan minimal 1 tugas hingga tuntas",
      progres: `${Math.min(1, r.totalSelesai)}/1 tugas`,
      terbuka: r.totalSelesai >= 1,
    },
    {
      ikon: "🔥",
      judul: lang === "en" ? "Streak Guardian" : "Pejuang Konsisten",
      ket:
        lang === "en"
          ? "Maintain a 3-day active streak"
          : "Jaga rekor streak minimal 3 hari beruntun",
      progres: `${Math.min(3, r.rekor)}/3 hari`,
      terbuka: r.rekor >= 3,
    },
    {
      ikon: "⚡",
      judul: "Anti-SKS Club",
      ket:
        lang === "en"
          ? "Reach Level 2 by earning 100+ EXP"
          : "Tembus Level 2 dengan mengumpulkan 100+ XP",
      progres: `${Math.min(100, r.exp)}/100 XP`,
      terbuka: r.exp >= 100,
    },
  ];

  const GAYA_MATE = [
    { id: "SUPPORTIVE", label: "Suportif" },
    { id: "SANTAI", label: "Santai" },
    { id: "TEGAS", label: "Tegas" },
  ] as const;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
          <span className="judul-stabilo">{t.profileTitle}</span>
        </h1>
        <p className="mt-1 text-sm text-muted">
          {lang === "en"
            ? "Manage your cloud account, language, interface theme, and academic milestones."
            : "Kelola akun penyimpanan, bahasa, tema tampilan, dan pencapaian belajarmu."}
        </p>
      </div>

      {/* Kartu Identitas User */}
      <section className="kartu-lime flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl border-2 border-[color:var(--line)] bg-lime text-2xl font-extrabold text-[#111310]">
            {nama.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xl font-extrabold text-ink">{nama}</p>
              <span className="rounded-full border border-[color:var(--line)] bg-[color:var(--surface-2)] px-2.5 py-0.5 text-xs font-extrabold text-ink">
                Level {r.level}
              </span>
            </div>
            <p className="mt-0.5 text-xs font-semibold text-muted">
              {user.email} · {r.exp} XP Total
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-xl border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] px-3 py-1.5 text-xs font-extrabold text-ink">
            <span className={r.streak === 0 ? "grayscale opacity-45" : ""}>
              🔥
            </span>{" "}
            {r.streak} hari
          </span>
          <span className="rounded-xl border-2 border-[color:var(--line)] bg-[color:var(--surface-2)] px-3 py-1.5 text-xs font-extrabold text-ink">
            ✓ {r.totalSelesai} {t.done}
          </span>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Kolom Kiri: Akun Permanen + Gaya Bicara Mate Ringkas */}
        <div className="space-y-6">
          <section className="kartu p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-extrabold text-ink">
                {t.accountSection}
              </h2>
              <span className="rounded-full border border-[color:var(--line)] bg-[color:var(--surface-2)] px-2.5 py-0.5 text-xs font-bold text-muted">
                {pakaiAkunPribadi ? "Tersinkron" : "Sesi Lokal"}
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
                Simpan akun
              </button>
            </form>
          </section>
        </div>

        {/* Kolom Kanan: Bahasa, Tema & Pencapaian Akademik dengan Indikator Progres */}
        <div className="space-y-6">
          <section className="kartu space-y-5 p-5">
            <div>
              <h2 className="text-base font-extrabold text-ink">Bahasa</h2>
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
                        ? "border-[color:var(--line)] bg-lime text-[#111310]"
                        : "border-[color:var(--line)] bg-[color:var(--surface-2)] text-ink hover:border-lime"
                    }`}
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
                    className={`w-full rounded-xl border-2 p-2.5 text-xs font-extrabold transition ${
                      lang === "en"
                        ? "border-[color:var(--line)] bg-lime text-[#111310]"
                        : "border-[color:var(--line)] bg-[color:var(--surface-2)] text-ink hover:border-lime"
                    }`}
                  >
                    English
                  </button>
                </form>
              </div>
            </div>

            <div className="border-t-2 border-[color:var(--line)]/20 pt-4">
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
                  key={b.judul}
                  className={`flex items-center gap-3 rounded-xl border-2 p-3 ${
                    b.terbuka
                      ? "border-[color:var(--line)] border-l-4 border-l-lime bg-[color:var(--surface-2)] text-ink"
                      : "border-[color:var(--line)]/50 bg-[color:var(--surface-2)]/60 text-muted"
                  }`}
                >
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-xl border-2 text-base font-extrabold ${
                      b.terbuka
                        ? "border-[color:var(--line)] bg-lime text-[#111310]"
                        : "border-[color:var(--line)] bg-[color:var(--surface)] text-muted grayscale"
                    }`}
                  >
                    {b.terbuka ? "✓" : b.ikon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-extrabold text-ink">
                        {b.judul}
                      </p>
                      <span className="rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-2 py-0.5 text-xs font-bold text-ink">
                        {b.progres}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{b.ket}</p>
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
