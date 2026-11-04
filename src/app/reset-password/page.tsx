"use client";

import { useActionState, use } from "react";
import Link from "next/link";
import { resetPasswordBaru, type HasilAuth } from "@/server/auth-actions";
import { Icon } from "@/components/ui/Icon";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = use(searchParams);
  const token = params.token ?? "";

  const [state, formAction, pending] = useActionState<HasilAuth, FormData>(
    resetPasswordBaru,
    null,
  );

  return (
    <main className="grid min-h-dvh place-items-center bg-[color:var(--bg)] px-4 py-10 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(var(--ink) 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="kartu w-full max-w-[26rem] p-6 sm:p-8 relative z-10 bg-card border-2 border-[color:var(--line)] shadow-[0_6px_0_var(--sh)]">
        <div className="mb-6 text-center">
          <span className="inline-grid size-16 place-items-center rounded-2xl border-2 border-[#111] bg-lime text-3xl font-black text-[#111] shadow-[0_4px_0_var(--sh)] -rotate-3">
            <Icon name="lock" className="size-8 text-[#111]" />
          </span>
          <h1 className="mt-4 text-2xl font-black text-ink">Password Baru</h1>
          <p className="mt-2 text-sm font-semibold text-muted">
            Bikin password baru yang gampang kamu inget. Minimal 6 karakter.
          </p>
        </div>

        {!token ? (
          <div className="rounded-xl border-2 border-[color:var(--bahaya)] bg-[color:var(--bahaya-bg)] px-4 py-3 text-sm font-bold text-[color:var(--bahaya)]">
            Link reset tidak valid. Silakan minta link baru.
          </div>
        ) : state?.ok ? (
          <div className="space-y-4">
            <div className="rounded-xl border-2 border-[color:var(--santai)] bg-[color:var(--santai-bg)] px-4 py-3 text-sm font-bold text-[color:var(--santai)]">
              {state.pesan}
            </div>
            <Link
              href="/login"
              className="block w-full text-center rounded-xl border-2 border-[#111] bg-lime py-3 text-sm font-black text-[#111] shadow-[0_3px_0_var(--sh)] hover:-translate-y-0.5 transition-transform"
            >
              Login Sekarang →
            </Link>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="token" value={token} />

            <div className="group">
              <label
                htmlFor="reset-pass"
                className="mb-1.5 block text-sm font-bold text-ink"
              >
                Password Baru
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-muted">
                  <Icon name="lock" className="size-4" />
                </span>
                <input
                  id="reset-pass"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimal 6 karakter"
                  style={{ paddingLeft: "2.75rem" }}
                  className="kolom font-semibold"
                />
              </div>
            </div>

            <div className="group">
              <label
                htmlFor="reset-konfirm"
                className="mb-1.5 block text-sm font-bold text-ink"
              >
                Ulangi Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-muted">
                  <Icon name="lock" className="size-4" />
                </span>
                <input
                  id="reset-konfirm"
                  name="konfirmasi"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Ketik ulang password"
                  style={{ paddingLeft: "2.75rem" }}
                  className="kolom font-semibold"
                />
              </div>
            </div>

            {state?.error && (
              <div className="flex items-start gap-2 rounded-lg border-2 border-[color:var(--bahaya)] bg-[color:var(--bahaya-bg)] px-3 py-2">
                <Icon
                  name="alert"
                  className="mt-0.5 size-4 shrink-0 text-[color:var(--bahaya)]"
                />
                <p className="text-xs font-bold leading-snug text-[color:var(--bahaya)]">
                  {state.error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="relative w-full group disabled:opacity-60 mt-2"
            >
              <div className="absolute inset-0 bg-[#111] rounded-xl translate-y-1.5 transition-transform group-hover:translate-y-2 group-active:translate-y-0" />
              <div className="relative flex items-center justify-center gap-2 w-full bg-lime text-[#111] border-2 border-[#111] rounded-xl py-3.5 text-sm font-black transition-transform group-hover:-translate-y-0.5 group-active:translate-y-1">
                {pending ? "Menyimpan..." : "Simpan Password Baru"}
              </div>
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-xs font-bold text-biru hover:underline"
          >
            ← Kembali ke Login
          </Link>
        </div>
      </div>
    </main>
  );
}
