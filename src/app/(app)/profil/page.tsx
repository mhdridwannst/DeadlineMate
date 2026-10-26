import { ambilRingkasan } from "@/lib/stats";
import { getDemoUser } from "@/server/demo-user";
import { ubahProfilPreferensi } from "@/server/tugas-form";
import ThemeSwitch from "@/components/shell/ThemeSwitch";

export const dynamic = "force-dynamic";

const NADA_MATE = [
  {
    id: "SUPPORTIVE",
    label: "Supportive Mentor",
    badge: "Hangat",
    ket: "Mengapresiasi setiap progres kecil dan menjaga ritme belajarmu tetap tenang.",
  },
  {
    id: "SANTAI",
    label: "Bestie Kampus",
    badge: "Santai",
    ket: "Gaya ngobrol teman satu tongkrongan, asik tapi tetap ngingetin tenggat.",
  },
  {
    id: "TEGAS",
    label: "Dosen Pembimbing",
    badge: "Tegas",
    ket: "To-the-point dan disiplin kalau kamu mulai menunda-nunda tugas prioritas.",
  },
] as const;

export default async function ProfilPage() {
  const user = await getDemoUser();
  const r = await ambilRingkasan(user.id);
  const nama = user.name ?? "Wannn";

  const stat = [
    { label: "Streak Aktif", nilai: `${r.streak} hari`, aksen: "text-lime" },
    { label: "Rekor Terbaik", nilai: `${r.rekor} hari`, aksen: "text-ink" },
    { label: "Tugas Selesai", nilai: `${r.totalSelesai}`, aksen: "text-ink" },
    { label: "Total EXP", nilai: `${r.exp} XP`, aksen: "text-biru" },
  ];

  const lencana = [
    {
      kode: "01",
      judul: "Langkah Pertama",
      ket: "Menyelesaikan minimal 1 tugas hingga tuntas",
      terbuka: r.totalSelesai >= 1,
    },
    {
      kode: "02",
      judul: "Pejuang Konsisten",
      ket: "Menjaga rekor streak minimal 3 hari beruntun",
      terbuka: r.rekor >= 3,
    },
    {
      kode: "03",
      judul: "Anti-SKS Club",
      ket: "Menembus Level 2 dengan mengumpulkan 100+ EXP",
      terbuka: r.exp >= 100,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">
          <span className="judul-stabilo">Profil mahasiswa</span>
        </h1>
        <p className="mt-1 text-base text-muted">
          Personalisasi karakter AI Coach Mate, tema antarmuka, dan progres
          akademikmu.
        </p>
      </div>

      {/* Kartu Identitas dengan kontras sempurna di Dark & Light Mode */}
      <section className="kartu-lime flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl border-2 border-[#0f172a] bg-lime text-3xl font-extrabold text-[#090d16] shadow-[0_3px_0_var(--sh)]">
            {nama.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-2xl font-extrabold text-ink">{nama}</p>
              <span className="rounded-full border border-[color:var(--line)] bg-card px-2.5 py-0.5 text-xs font-extrabold text-ink">
                Level {r.level}
              </span>
            </div>
            <p className="mt-0.5 text-sm font-semibold text-muted">
              Mahasiswa · Pejuang Deadline · {r.expLevel}/100 EXP ke Level{" "}
              {r.level + 1}
            </p>
          </div>
        </div>

        <span className="rounded-xl border-2 border-[color:var(--line)] bg-card px-3.5 py-2 text-xs font-extrabold text-ink shadow-[0_2px_0_var(--sh)]">
          Mate Persona: {user.coachTone}
        </span>
      </section>

      {/* Bento Grid Statistik */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stat.map((s) => (
          <div key={s.label} className="kartu p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              {s.label}
            </p>
            <p className={`mt-1.5 text-3xl font-extrabold ${s.aksen}`}>
              {s.nilai}
            </p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pengaturan Karakter AI Coach */}
        <section className="kartu p-5">
          <h2 className="text-lg font-extrabold text-ink">
            Karakter AI Coach (Mate)
          </h2>
          <p className="mt-1 text-xs text-muted">
            Pilih gaya komunikasi Mate saat mengevaluasi tugas dan menyusun
            jadwalmu.
          </p>

          <form action={ubahProfilPreferensi} className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="p-nama"
                className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-muted"
              >
                Nama Panggilan
              </label>
              <input
                id="p-nama"
                name="nama"
                defaultValue={nama}
                className="kolom"
              />
            </div>

            <fieldset className="space-y-2.5">
              <legend className="mb-1.5 text-xs font-extrabold uppercase tracking-wider text-muted">
                Nada Bicara Mate
              </legend>
              {NADA_MATE.map((t) => {
                const aktif = user.coachTone === t.id;
                return (
                  <label
                    key={t.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition ${
                      aktif
                        ? "border-lime bg-bg shadow-[0_2px_0_var(--sh)]"
                        : "border-[color:var(--line)]/40 bg-bg/50 hover:border-[color:var(--line)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="coachTone"
                      value={t.id}
                      defaultChecked={aktif}
                      className="mt-1 size-4 accent-lime"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-extrabold text-ink">
                          {t.label}
                        </span>
                        <span className="rounded-md border border-[color:var(--line)] bg-card px-2 py-0.5 text-[10px] font-extrabold text-muted">
                          {t.badge}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        {t.ket}
                      </p>
                    </div>
                  </label>
                );
              })}
            </fieldset>

            <button type="submit" className="tombol w-full">
              Simpan Preferensi Mate
            </button>
          </form>
        </section>

        <div className="space-y-6">
          {/* Tema */}
          <section className="kartu p-5">
            <h2 className="text-lg font-extrabold text-ink">Tampilan & Tema</h2>
            <p className="mb-3 mt-1 text-xs text-muted">
              Pilih mode terang, gelap (Midnight Slate), atau ikuti sistem.
            </p>
            <ThemeSwitch />
          </section>

          {/* Lencana Pencapaian dengan Teks Kontras Tinggi */}
          <section className="kartu p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-ink">
                Lencana Pencapaian
              </h2>
              <span className="text-xs font-extrabold text-muted">
                {lencana.filter((l) => l.terbuka).length}/{lencana.length}{" "}
                Terbuka
              </span>
            </div>

            <ul className="mt-3.5 space-y-2.5">
              {lencana.map((b) => (
                <li
                  key={b.judul}
                  className={`flex items-center gap-3.5 rounded-xl border-2 p-3 transition ${
                    b.terbuka
                      ? "border-lime bg-bg text-ink shadow-[0_2px_0_var(--sh)]"
                      : "border-[color:var(--line)]/30 bg-bg/30 text-muted opacity-60"
                  }`}
                >
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-xl border-2 font-mono text-xs font-extrabold ${
                      b.terbuka
                        ? "border-[#0f172a] bg-lime text-[#090d16]"
                        : "border-[color:var(--line)] bg-card text-muted"
                    }`}
                  >
                    {b.terbuka ? "✓" : b.kode}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-extrabold text-ink">
                        {b.judul}
                      </p>
                      {b.terbuka && (
                        <span className="rounded-full bg-lime/20 px-2 py-0.5 text-[10px] font-extrabold text-lime">
                          Tercapai
                        </span>
                      )}
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
