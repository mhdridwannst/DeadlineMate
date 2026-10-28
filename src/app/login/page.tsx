import { masukAkun } from "@/server/demo-user";

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4 py-10">
      <div className="kartu w-full max-w-md p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl border-2 border-ink bg-lime text-xl font-extrabold text-[#111]">
            D
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">
              DeadlineMate
            </h1>
            <p className="text-xs font-semibold text-muted">
              Smart Student Productivity
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-extrabold text-ink">
            <span className="judul-stabilo">Masuk ke Akunmu</span>
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            Gunakan email masing-masing agar daftar tugas, streak, dan progres
            belajarmu tersimpan terpisah dan tidak saling tabrakan.
          </p>
        </div>

        <form action={masukAkun} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="login-nama"
              className="mb-1.5 block text-sm font-bold text-ink"
            >
              Nama Panggilan
            </label>
            <input
              id="login-nama"
              name="nama"
              type="text"
              required
              placeholder="Mis. Go Yoon Jung / Ryujin"
              className="kolom"
            />
          </div>

          <div>
            <label
              htmlFor="login-email"
              className="mb-1.5 block text-sm font-bold text-ink"
            >
              Email Mahasiswa / Pribadi
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              required
              placeholder="nama@mahasiswa.ac.id"
              className="kolom"
            />
          </div>

          <button type="submit" className="tombol mt-2 w-full text-base">
            Masuk Sekarang
          </button>
        </form>
      </div>
    </div>
  );
}
