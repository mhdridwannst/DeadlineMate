import Link from "next/link";
import type { ReactNode } from "react";

export default function LegalPage({
  title,
  intro,
  backLabel,
  updatedLabel,
  updatedAt,
  children,
}: {
  title: string;
  intro: string;
  backLabel: string;
  updatedLabel: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-bg text-ink">
      <header className="border-b-2 border-[color:var(--line)]/15">
        <div className="mx-auto flex min-h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/login" className="font-extrabold text-ink">
            DeadlineMate
          </Link>
          <Link
            href="/login"
            className="text-sm font-bold text-muted underline underline-offset-4 hover:text-ink"
          >
            {backLabel}
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <p className="text-xs font-extrabold uppercase tracking-wider text-muted">
          {updatedLabel}: {updatedAt}
        </p>
        <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">
          <span className="judul-stabilo">{title}</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
          {intro}
        </p>
        <div className="mt-10 space-y-8 text-sm leading-7 text-ink [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-extrabold [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
          {children}
        </div>
      </article>
    </main>
  );
}
