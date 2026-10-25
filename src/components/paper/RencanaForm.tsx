"use client";

import { useActionState } from "react";
import { rencanakan, type HasilRencana } from "@/server/ai-plan";

export function RencanaForm() {
  const [hasil, aksi, pending] = useActionState<HasilRencana, FormData>(
    rencanakan,
    null,
  );

  return (
    <form action={aksi} className="mt-8">
      <label htmlFor="teks" className="block text-lg font-semibold">
        Tulis semua tugasmu, bebas aja
      </label>
      <p id="teks-bantuan" className="mt-1 text-sm text-pensil/70">
        Contoh: laporan kimia kumpul Jumat, makalah sosiologi Senin depan jam
        12.
      </p>
      <textarea
        id="teks"
        name="teks"
        rows={3}
        required
        maxLength={1500}
        readOnly={pending}
        aria-describedby="teks-bantuan"
        className="mt-3 w-full resize-y border border-garis bg-white p-3 text-base outline-none focus:border-tinta"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 bg-tinta px-4 text-base text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta disabled:opacity-60"
        >
          {pending ? "Menyusun..." : "Susun dengan Mate"}
        </button>
        {pending ? (
          <p role="status" className="font-tulis text-lg text-merah">
            Mate lagi baca tugasmu dan nyusun langkahnya...
          </p>
        ) : (
          hasil && (
            <p
              role="status"
              className={
                hasil.ok ? "text-pensil/70" : "font-semibold text-merah"
              }
            >
              {hasil.pesan}
            </p>
          )
        )}
      </div>
    </form>
  );
}
