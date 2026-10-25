import { ambilRingkasan } from "@/lib/stats";
import { getDemoUser } from "@/server/demo-user";
import { ubahProfilPreferensi } from "@/server/tugas-form";
import ThemeSwitch from "@/components/shell/ThemeSwitch";

export const dynamic = "force-dynamic";

const NADA_MATE = [
  {
    id: "SUPPORTIVE",
    label: "🌱 Supportive",
    ket: "Hangat, mengapresiasi progres kecil, tanpa bikin panik.",
  },
  {
    id: "SANTAI",
    label: "😎 Santai (Bestie)",
    ket: "Gaya teman nongkrong kampus, asik tapi tetap ngingetin.",
  },
  {
    id: "TEGAS",
    label: "🔥 Tegas (Dosen Killer)",
    ket: "To-the-point, galak kalau kamu suka menunda deadline.",
  },
] as const;

export default async function ProfilPage() {
  const user = await getDemoUser();
  const r = await ambilRingkasan(user.id);
  const nama = user.name ?? "Zaki";

  const stat = [
    { ikon: "🔥", n: r.streak, l: "Streak aktif" },
    { ikon: "🏆", n: r.rekor, l: "Rekor terbaik" },
    { ikon: "✅", n: r.totalSelesai, l: "Tugas selesai" },
    { ikon: "⚡", n: r.exp, l: "Total EXP" },
  ];

  const lencana = [
    {
      judul: "Langkah Pertama",
      ket: "Menyelesaikan minimal 1 tugas",
      terbuka: r.totalSelesai >= 1,
    },
    {
      judul: "Pejuang Streak",
      ket: "Menjaga streak 3 tugas beruntun",
      terbuka: r.rekor >= 3,
    },
    {
      judul: "Anti-SKS Club",
      ket: "Menembus Level 2 (100+ EXP)",
      terbuka: r.exp >= 100,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">
          <span className="judul-stabilo">Profil mahasiswa</span>
        </h1>
        <p className="mt-1 text-base text-muted">
          Atur karakter AI Coach Mate, tema tampilan, dan lihat pencapaianmu.
        </p>
      </div>

      <section
        className="kartu flex flex-wrap items-center justify-between gap-4 p-5"
        style={{ background: "var(--lime-soft)" }}
      >
        <div className="flex items-center gap-4">
          <span
            className="grid size-16 place-items-center rounded-2xl border-2 border-ink text-3xl font-extrabold text-[#111] shadow-[0_3px_0_var(--sh)]"
            style={{ background: "var(--lime)" }}
          >
            {nama.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="text-2xl font-extrabold text-[#111]">{nama}</p>
            <p className="text-sm font-bold text-[#111]/75">
              Mahasiswa · Pejuang Deadline · Level {r.level}
            </p>
          </div>
        </div>
        <span className="rounded-xl border-2 border-ink bg-card px-3 py-1.5 text-xs font-extrabold text-ink">
          😁 Mate Mode: {user.coachTone}
        </span>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stat.map((s) => (
          <div key={s.l} className="kartu p-4 text-center">
            <span className="text-xl">{s.ikon}</span>
            <p className="mt-1 text-3xl font-extrabold">{s.n}</p>
            <p className="text-xs font-bold text-muted">{s.l}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="kartu p-5">
          <h2 className="text-lg font-extrabold">Karakter AI Coach (Mate)</h2>
          <p className="mt-1 text-xs text-muted">
            Pilih gaya bicara Mate saat memberi evaluasi & menyusun jadwalmu.
          </p>

          <form action={ubahProfilPreferensi} className="mt-4 space-y-3">
            <div>
              <label
                htmlFor="p-nama"
                className="mb-1 block text-xs font-extrabold uppercase text-muted"
              >
                Nama Panggilan
              </label>
              <input
                id="p-nama"
                name="nama"
                defaultValue={nama}
                className="kolom min-h-10 text-sm"
              />
            </div>

            <fieldset className="space-y-2 pt-1">
              <legend className="mb-1.5 text-xs font-extrabold uppercase text-muted">
                Nada Bicara Mate
              </legend>
              {NADA_MATE.map((t) => (
                <label
                  key={t.id}
                  className="flex cursor-pointer items-start gap-2.5 rounded-xl border-2 border-ink/20 bg-bg/60 p-2.5 transition hover:border-ink"
                >
                  <input
                    type="radio"
                    name="coachTone"
                    value={t.id}
                    defaultChecked={user.coachTone === t.id}
                    className="mt-1 size-4 accent-[#111]"
                  />
                  <div>
                    <span className="block text-sm font-extrabold">
                      {t.label}
                    </span>
                    <span className="text-xs text-muted">{t.ket}</span>
                  </div>
                </label>
              ))}
            </fieldset>

            <button type="submit" className="tombol tombol-kecil w-full">
              Simpan Preferensi Mate
            </button>
          </form>
        </section>

        <div className="space-y-6">
          <section className="kartu p-5">
            <h2 className="text-lg font-extrabold">Tampilan & Tema</h2>
            <p className="mb-3 mt-1 text-xs text-muted">
              Pilih mode terang, gelap, atau ikuti sistem perangkatmu.
            </p>
            <ThemeSwitch />
          </section>

          <section className="kartu p-5">
            <h2 className="text-lg font-extrabold">Lencana Pencapaian</h2>
            <ul className="mt-3 space-y-2.5">
              {lencana.map((b) => (
                <li
                  key={b.judul}
                  className={`flex items-center gap-3 rounded-xl border-2 p-2.5 ${
                    b.terbuka
                      ? "border-ink bg-lime-soft text-[#111]"
                      : "border-ink/15 bg-bg/40 opacity-55"
                  }`}
                >
                  <span className="text-xl">{b.terbuka ? "🏅" : "🔒"}</span>
                  <div>
                    <p className="text-sm font-extrabold">{b.judul}</p>
                    <p className="text-xs opacity-80">{b.ket}</p>
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
